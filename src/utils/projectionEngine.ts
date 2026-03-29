import type { PortfolioEntry, Scenario, ProjectionPoint } from '../types';
import { getDividendMonths } from './calculations';

const PERIODS_PER_YEAR: Record<string, number> = {
  monthly: 12,
  quarterly: 4,
  'semi-annual': 2,
  annual: 1,
};

export function runProjection(
  portfolio: PortfolioEntry[],
  scenario: Scenario,
  now: Date = new Date()
): ProjectionPoint[] {
  const horizonMonths = Math.max(1, scenario.horizonYears) * 12;

  if (portfolio.length === 0) {
    return Array.from({ length: horizonMonths }, (_, i) => {
      const m = i + 1;
      const totalMonths = now.getMonth() + m;
      return {
        month: m,
        calendarYear: now.getFullYear() + Math.floor(totalMonths / 12),
        calendarMonth: totalMonths % 12,
        monthlyIncome: 0,
        rollingAnnualIncome: 0,
        coverageRatio: 0,
      };
    });
  }

  // Deep-clone working holdings; do NOT mutate PortfolioContext state
  const workingHoldings = portfolio.map(h => ({ ...h }));

  // Pre-compute payout months per holding — guard against invalid dates
  const payoutMonthsCache = workingHoldings.map(h => {
    try {
      return getDividendMonths(h.dividendFrequency, h.exDividendDate);
    } catch {
      return [];
    }
  });

  // Freeze initial weights by cost basis at t=0 (avoids contribution drift)
  const totalCostBasis = workingHoldings.reduce(
    (sum, h) => sum + h.shares * Math.max(0, h.averageCostBasis),
    0
  );
  const initialWeights = new Map<string, number>(
    workingHoldings.map(h => [
      h.id,
      totalCostBasis > 0 ? (h.shares * Math.max(0, h.averageCostBasis)) / totalCostBasis : 0,
    ])
  );

  const points: ProjectionPoint[] = [];
  const rollingWindow: number[] = [];

  for (let m = 1; m <= horizonMonths; m++) {
    const totalMonths = now.getMonth() + m;
    const calendarYear = now.getFullYear() + Math.floor(totalMonths / 12);
    const calendarMonth = totalMonths % 12;

    let monthTotal = 0;

    workingHoldings.forEach((h, idx) => {
      const payoutMonths = payoutMonthsCache[idx];
      const isDividendMonth = payoutMonths.includes(calendarMonth);

      const periodsPerYear = PERIODS_PER_YEAR[h.dividendFrequency] ?? 4;
      const dividendGrowthFactor = Math.pow(1 + scenario.dividendGrowthRate, m / 12);
      const periodDividend =
        (h.annualDividendPerShare / periodsPerYear) * dividendGrowthFactor;

      const grossDividend = isDividendMonth ? h.shares * periodDividend : 0;
      const netDividend = grossDividend * (1 - scenario.taxRate);
      monthTotal += netDividend;

      // DRIP: reinvest net dividends + allocate monthly contribution by frozen weight
      const weight = initialWeights.get(h.id) ?? 0;
      const contributionForHolding = scenario.monthlyContribution * weight;
      const costBasisPrice = Math.max(h.averageCostBasis, 0.0001); // guard div-by-zero

      const newSharesFromDRIP = (netDividend * scenario.reinvestRate) / costBasisPrice;
      const newSharesFromContribution = contributionForHolding / costBasisPrice;
      h.shares += newSharesFromDRIP + newSharesFromContribution;
    });

    rollingWindow.push(monthTotal);
    if (rollingWindow.length > 12) rollingWindow.shift();

    const rollingAnnualIncome =
      rollingWindow.reduce((s, v) => s + v, 0) * (12 / rollingWindow.length);

    const coverageRatio =
      scenario.targetMonthlyIncome > 0
        ? rollingAnnualIncome / 12 / scenario.targetMonthlyIncome
        : 0;

    points.push({
      month: m,
      calendarYear,
      calendarMonth,
      monthlyIncome: monthTotal,
      rollingAnnualIncome,
      coverageRatio,
    });
  }

  return points;
}

/**
 * Returns the estimated monthly income for the current month.
 * Sums net dividends for holdings paying this month; falls back to
 * rollingAnnualIncome/12 from the first projection point if no holdings pay now.
 */
export function calculateIncomeToday(
  portfolio: PortfolioEntry[],
  scenario: Scenario,
  now: Date = new Date()
): number {
  if (portfolio.length === 0) return 0;

  const currentMonth = now.getMonth();
  let total = 0;
  let anyPayerThisMonth = false;

  portfolio.forEach(h => {
    try {
      const payoutMonths = getDividendMonths(h.dividendFrequency, h.exDividendDate);
      if (payoutMonths.includes(currentMonth)) {
        anyPayerThisMonth = true;
        const periodsPerYear = PERIODS_PER_YEAR[h.dividendFrequency] ?? 4;
        const grossDividend = h.shares * (h.annualDividendPerShare / periodsPerYear);
        total += grossDividend * (1 - scenario.taxRate);
      }
    } catch {
      // skip holdings with invalid dates
    }
  });

  if (anyPayerThisMonth) return total;

  // Fallback: use annualized income from first projection point
  const points = runProjection(portfolio, { ...scenario, horizonYears: 1 }, now);
  return points.length > 0 ? points[0].rollingAnnualIncome / 12 : 0;
}
