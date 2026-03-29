import type {
  PortfolioEntry,
  PortfolioSummary,
  MonthlyDividend,
  YearlyDividend,
  DividendFrequency
} from '../types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function calculateAnnualDividend(entry: PortfolioEntry): number {
  return entry.shares * entry.annualDividendPerShare;
}

export function calculateDividendYield(entry: PortfolioEntry): number {
  const costBasis = entry.shares * entry.averageCostBasis;
  if (costBasis === 0) return 0;
  return safeCalculate(() => (calculateAnnualDividend(entry) / costBasis) * 100);
}

/**
 * Safely calculate a number, returning 0 if result is NaN or undefined
 */
export function safeCalculate(calculateFn: () => number): number {
  const result = calculateFn();
  return isNaN(result) || !isFinite(result) ? 0 : result;
}

/**
 * Calculate Expected Dividend Yield (DIVe)
 * If expectedDividendYield is manually set, use that value.
 * Otherwise, calculate from (Annual Dividend Per Share / Average Cost Basis) * 100
 * Returns 0 instead of NaN when calculation is not possible.
 */
export function calculateExpectedDividendYield(entry: PortfolioEntry): number {
  // If user has manually set an expected yield, use that
  if (entry.expectedDividendYield !== undefined && entry.expectedDividendYield !== null) {
    return safeCalculate(() => entry.expectedDividendYield!);
  }
  // Otherwise calculate from annual dividend per share and average cost basis
  if (!entry.averageCostBasis || entry.averageCostBasis === 0) {
    return 0;
  }
  return safeCalculate(() => (entry.annualDividendPerShare / entry.averageCostBasis) * 100);
}

/**
 * Calculate Annual Dividend Per Share from Expected Dividend Yield (DIVe)
 * div/share = (DIVe * averageCostBasis) / 100
 * Returns 0 instead of NaN when calculation is not possible.
 */
export function calculateAnnualDividendPerShareFromYield(
  expectedDividendYield: number,
  averageCostBasis: number
): number {
  if (!averageCostBasis || averageCostBasis === 0) {
    return 0;
  }
  return safeCalculate(() => (expectedDividendYield * averageCostBasis) / 100);
}

/**
 * Apply bidirectional DIVe calculation:
 * - If user provides DIVe but NOT div/share: calculate div/share = (DIVe * averageCostBasis) / 100
 * - If user provides div/share but NOT DIVe: calculate DIVe = (div/share / averageCostBasis) * 100
 * - If both have values: use the provided values as-is
 * - If neither has values: show 0 for both
 */
export function calculateBidirectionalDIVe(
  expectedDividendYield: number | undefined,
  annualDividendPerShare: number,
  averageCostBasis: number
): { expectedDividendYield: number; annualDividendPerShare: number } {
  const hasDIVe = expectedDividendYield !== undefined && expectedDividendYield !== null;
  const hasDivShare = annualDividendPerShare !== undefined && annualDividendPerShare !== 0;

  // Case 1: Neither has values - show 0 for both
  if (!hasDIVe && !hasDivShare) {
    return { expectedDividendYield: 0, annualDividendPerShare: 0 };
  }

  // Case 2: Both have values - use as-is
  if (hasDIVe && hasDivShare) {
    return {
      expectedDividendYield: safeCalculate(() => expectedDividendYield!),
      annualDividendPerShare: safeCalculate(() => annualDividendPerShare)
    };
  }

  // Case 3: DIVe provided, but NOT div/share - calculate div/share
  if (hasDIVe && !hasDivShare) {
    const calculatedDivShare = calculateAnnualDividendPerShareFromYield(
      expectedDividendYield!,
      averageCostBasis
    );
    return {
      expectedDividendYield: safeCalculate(() => expectedDividendYield!),
      annualDividendPerShare: calculatedDivShare
    };
  }

  // Case 4: div/share provided, but NOT DIVe - calculate DIVe
  // (This should not normally happen since annualDividendPerShare defaults to 0, but handle it)
  const calculatedDIVe = safeCalculate(() => (annualDividendPerShare / averageCostBasis) * 100);
  return {
    expectedDividendYield: averageCostBasis > 0 ? calculatedDIVe : 0,
    annualDividendPerShare: safeCalculate(() => annualDividendPerShare)
  };
}

export function getDividendMonths(frequency: DividendFrequency, exDividendDate: string): number[] {
  const month = new Date(exDividendDate).getMonth();
  
  switch (frequency) {
    case 'monthly':
      return Array.from({ length: 12 }, (_, i) => i);
    case 'quarterly':
      return [month, (month + 3) % 12, (month + 6) % 12, (month + 9) % 12];
    case 'semi-annual':
      return [month, (month + 6) % 12];
    case 'annual':
      return [month];
  }
}

export function calculateMonthlyDividends(entries: PortfolioEntry[]): MonthlyDividend[] {
  const monthlyData: Map<string, MonthlyDividend> = new Map();
  
  const currentYear = new Date().getFullYear();
  
  for (let month = 0; month < 12; month++) {
    const key = `${currentYear}-${month}`;
    monthlyData.set(key, {
      month: MONTHS[month],
      year: currentYear,
      amount: 0,
      stocks: []
    });
  }
  
  entries.forEach(entry => {
    const annualDividend = calculateAnnualDividend(entry);
    const months = getDividendMonths(entry.dividendFrequency, entry.exDividendDate);
    const perMonthDividend = annualDividend / months.length;
    
    months.forEach(month => {
      const key = `${currentYear}-${month}`;
      const existing = monthlyData.get(key)!;
      existing.amount += perMonthDividend;
      if (!existing.stocks.includes(entry.ticker)) {
        existing.stocks.push(entry.ticker);
      }
    });
  });
  
  return Array.from(monthlyData.values()).sort((a, b) => {
    const monthA = MONTHS.indexOf(a.month);
    const monthB = MONTHS.indexOf(b.month);
    return monthA - monthB;
  });
}

export function calculateYearlyDividends(entries: PortfolioEntry[]): YearlyDividend[] {
  const monthlyProjection = calculateMonthlyDividends(entries);
  const currentYear = new Date().getFullYear();
  
  const yearlyTotal = monthlyProjection.reduce((sum, m) => sum + m.amount, 0);
  
  return [{
    year: currentYear,
    totalAmount: yearlyTotal,
    monthlyBreakdown: monthlyProjection
  }];
}

export function calculatePortfolioSummary(entries: PortfolioEntry[]): PortfolioSummary {
  const totalValue = entries.reduce(
    (sum, entry) => sum + entry.shares * entry.averageCostBasis,
    0
  );
  
  const totalCostBasis = totalValue;
  const totalAnnualDividends = entries.reduce(
    (sum, entry) => sum + calculateAnnualDividend(entry),
    0
  );
  
  const dividendYield = totalCostBasis > 0 
    ? (totalAnnualDividends / totalCostBasis) * 100 
    : 0;
  
  const monthlyAverage = totalAnnualDividends / 12;
  const yearlyTotal = totalAnnualDividends;
  
  const topPerformers = entries
    .map(entry => ({
      ticker: entry.ticker,
      annualDividend: calculateAnnualDividend(entry),
      yield: calculateDividendYield(entry),
      expectedDividendYield: calculateExpectedDividendYield(entry)
    }))
    .sort((a, b) => b.annualDividend - a.annualDividend)
    .slice(0, 5);
  
  const monthlyProjection = calculateMonthlyDividends(entries);
  
  return {
    totalValue,
    totalCostBasis,
    totalAnnualDividends,
    dividendYield,
    monthlyAverage,
    yearlyTotal,
    topPerformers,
    monthlyProjection
  };
}

export function formatPercent(value: number): string {
  // Handle NaN, undefined, or invalid values
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
    return '0.00%';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function generateSampleData(): PortfolioEntry[] {
  return [
    {
      id: '1',
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      shares: 50,
      averageCostBasis: 145.00,
      annualDividendPerShare: 0.96,
      dividendFrequency: 'quarterly',
      exDividendDate: '2024-02-09'
    },
    {
      id: '2',
      ticker: 'MSFT',
      companyName: 'Microsoft Corporation',
      shares: 30,
      averageCostBasis: 320.00,
      annualDividendPerShare: 3.00,
      dividendFrequency: 'quarterly',
      exDividendDate: '2024-02-14'
    },
    {
      id: '3',
      ticker: 'JNJ',
      companyName: 'Johnson & Johnson',
      shares: 25,
      averageCostBasis: 160.00,
      annualDividendPerShare: 4.76,
      dividendFrequency: 'quarterly',
      exDividendDate: '2024-02-20'
    },
    {
      id: '4',
      ticker: 'O',
      companyName: 'Realty Income Corporation',
      shares: 100,
      averageCostBasis: 52.00,
      annualDividendPerShare: 3.08,
      dividendFrequency: 'monthly',
      exDividendDate: '2024-01-31'
    },
    {
      id: '5',
      ticker: 'KO',
      companyName: 'The Coca-Cola Company',
      shares: 40,
      averageCostBasis: 58.00,
      annualDividendPerShare: 1.84,
      dividendFrequency: 'quarterly',
      exDividendDate: '2024-03-14'
    },
    {
      id: '6',
      ticker: 'PG',
      companyName: 'Procter & Gamble Co.',
      shares: 20,
      averageCostBasis: 145.00,
      annualDividendPerShare: 3.76,
      dividendFrequency: 'quarterly',
      exDividendDate: '2024-01-18'
    },
    {
      id: '7',
      ticker: 'SCHD',
      companyName: 'Schwab U.S. Dividend Equity ETF',
      shares: 150,
      averageCostBasis: 72.00,
      annualDividendPerShare: 2.66,
      dividendFrequency: 'quarterly',
      exDividendDate: '2024-03-18'
    },
    {
      id: '8',
      ticker: 'VYM',
      companyName: 'Vanguard High Dividend Yield ETF',
      shares: 80,
      averageCostBasis: 105.00,
      annualDividendPerShare: 2.62,
      dividendFrequency: 'quarterly',
      exDividendDate: '2024-03-19'
    }
  ];
}
