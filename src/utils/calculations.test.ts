import { describe, it, expect } from 'vitest';
import {
  calculateAnnualDividend,
  calculateDividendYield,
  calculateExpectedDividendYield,
  calculateAnnualDividendPerShareFromYield,
  calculateBidirectionalDIVe,
  getDividendMonths,
  calculateMonthlyDividends,
  calculateYearlyDividends,
  calculatePortfolioSummary,
  formatPercent,
  formatNumber,
} from './calculations';
import type { PortfolioEntry } from '../types';

function makeEntry(overrides: Partial<PortfolioEntry> = {}): PortfolioEntry {
  return {
    id: '1',
    ticker: 'TEST',
    companyName: 'Test Co',
    shares: 100,
    averageCostBasis: 50,
    annualDividendPerShare: 2,
    dividendFrequency: 'quarterly',
    exDividendDate: '2024-01-15',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateAnnualDividend
// ---------------------------------------------------------------------------
describe('calculateAnnualDividend', () => {
  it('multiplies shares by annualDividendPerShare', () => {
    expect(calculateAnnualDividend(makeEntry({ shares: 100, annualDividendPerShare: 2 }))).toBe(200);
  });

  it('returns 0 when shares are 0', () => {
    expect(calculateAnnualDividend(makeEntry({ shares: 0 }))).toBe(0);
  });

  it('handles fractional shares', () => {
    expect(calculateAnnualDividend(makeEntry({ shares: 2.5, annualDividendPerShare: 4 }))).toBeCloseTo(10);
  });
});

// ---------------------------------------------------------------------------
// calculateDividendYield
// ---------------------------------------------------------------------------
describe('calculateDividendYield', () => {
  it('calculates yield as a percentage of cost basis', () => {
    // annual dividend = 100 * 2 = 200; cost basis = 100 * 50 = 5000; yield = 4%
    expect(calculateDividendYield(makeEntry())).toBeCloseTo(4);
  });

  it('returns 0 when averageCostBasis is 0', () => {
    expect(calculateDividendYield(makeEntry({ averageCostBasis: 0 }))).toBe(0);
  });

  it('returns 0 when shares are 0', () => {
    expect(calculateDividendYield(makeEntry({ shares: 0 }))).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateExpectedDividendYield
// ---------------------------------------------------------------------------
describe('calculateExpectedDividendYield', () => {
  it('returns manually set expectedDividendYield when provided', () => {
    expect(calculateExpectedDividendYield(makeEntry({ expectedDividendYield: 5.5 }))).toBeCloseTo(5.5);
  });

  it('calculates from annualDividendPerShare / averageCostBasis when not set', () => {
    // 2 / 50 * 100 = 4%
    expect(calculateExpectedDividendYield(makeEntry({ expectedDividendYield: undefined }))).toBeCloseTo(4);
  });

  it('returns 0 when averageCostBasis is 0 and no manual yield', () => {
    expect(
      calculateExpectedDividendYield(makeEntry({ averageCostBasis: 0, expectedDividendYield: undefined }))
    ).toBe(0);
  });

  it('returns manual value of 0 without recalculating', () => {
    // When explicitly set to 0, return 0 (not recalculate)
    expect(calculateExpectedDividendYield(makeEntry({ expectedDividendYield: 0 }))).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateAnnualDividendPerShareFromYield
// ---------------------------------------------------------------------------
describe('calculateAnnualDividendPerShareFromYield', () => {
  it('calculates div/share from yield and cost basis', () => {
    // (5 * 100) / 100 = 5
    expect(calculateAnnualDividendPerShareFromYield(5, 100)).toBeCloseTo(5);
  });

  it('returns 0 when averageCostBasis is 0', () => {
    expect(calculateAnnualDividendPerShareFromYield(5, 0)).toBe(0);
  });

  it('handles fractional yields', () => {
    expect(calculateAnnualDividendPerShareFromYield(4.5, 50)).toBeCloseTo(2.25);
  });
});

// ---------------------------------------------------------------------------
// calculateBidirectionalDIVe
// ---------------------------------------------------------------------------
describe('calculateBidirectionalDIVe', () => {
  it('returns zeros when neither DIVe nor div/share is provided', () => {
    const result = calculateBidirectionalDIVe(undefined, 0, 50);
    expect(result.expectedDividendYield).toBe(0);
    expect(result.annualDividendPerShare).toBe(0);
  });

  it('passes both values through when both are provided', () => {
    const result = calculateBidirectionalDIVe(5, 2, 50);
    expect(result.expectedDividendYield).toBeCloseTo(5);
    expect(result.annualDividendPerShare).toBeCloseTo(2);
  });

  it('calculates div/share from DIVe when div/share is 0', () => {
    // DIVe=4, cost=50 => div/share = (4*50)/100 = 2
    const result = calculateBidirectionalDIVe(4, 0, 50);
    expect(result.expectedDividendYield).toBeCloseTo(4);
    expect(result.annualDividendPerShare).toBeCloseTo(2);
  });

  it('calculates DIVe from div/share when DIVe is not provided', () => {
    // div/share=2, cost=50 => DIVe = (2/50)*100 = 4
    const result = calculateBidirectionalDIVe(undefined, 2, 50);
    expect(result.expectedDividendYield).toBeCloseTo(4);
    expect(result.annualDividendPerShare).toBeCloseTo(2);
  });

  it('returns DIVe of 0 when cost basis is 0 and no DIVe provided', () => {
    const result = calculateBidirectionalDIVe(undefined, 2, 0);
    expect(result.expectedDividendYield).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getDividendMonths
// ---------------------------------------------------------------------------
describe('getDividendMonths', () => {
  it('returns all 12 months for monthly frequency', () => {
    const months = getDividendMonths('monthly', '2024-01-15');
    expect(months).toHaveLength(12);
    expect(months).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('returns 4 months for quarterly, wrapping around year end', () => {
    // exDividendDate month = January (0)
    const months = getDividendMonths('quarterly', '2024-01-15');
    expect(months).toHaveLength(4);
    expect(months).toEqual([0, 3, 6, 9]); // Jan, Apr, Jul, Oct
  });

  it('returns 4 months for quarterly starting in October', () => {
    // October = month 9
    const months = getDividendMonths('quarterly', '2024-10-15');
    expect(months).toHaveLength(4);
    expect(months).toContain(9);  // Oct
    expect(months).toContain(0);  // Jan (wraps)
    expect(months).toContain(3);  // Apr (wraps)
    expect(months).toContain(6);  // Jul (wraps)
  });

  it('returns 2 months for semi-annual', () => {
    // March = month 2
    const months = getDividendMonths('semi-annual', '2024-03-15');
    expect(months).toHaveLength(2);
    expect(months).toContain(2);  // March
    expect(months).toContain(8);  // September
  });

  it('returns 1 month for annual', () => {
    const months = getDividendMonths('annual', '2024-06-15');
    expect(months).toHaveLength(1);
    expect(months).toContain(5); // June
  });
});

// ---------------------------------------------------------------------------
// calculateMonthlyDividends
// ---------------------------------------------------------------------------
describe('calculateMonthlyDividends', () => {
  it('returns 12 months', () => {
    const result = calculateMonthlyDividends([]);
    expect(result).toHaveLength(12);
  });

  it('months are in calendar order (Jan first)', () => {
    const result = calculateMonthlyDividends([]);
    expect(result[0].month).toBe('January');
    expect(result[11].month).toBe('December');
  });

  it('distributes annual dividend evenly across payment months', () => {
    const entry = makeEntry({
      shares: 100,
      annualDividendPerShare: 4,
      dividendFrequency: 'quarterly',
      exDividendDate: '2024-01-15', // pays Jan, Apr, Jul, Oct
    });
    const result = calculateMonthlyDividends([entry]);
    // 100 * 4 = 400 annual / 4 months = 100 per month
    const jan = result.find(m => m.month === 'January')!;
    const apr = result.find(m => m.month === 'April')!;
    const jun = result.find(m => m.month === 'June')!;
    expect(jan.amount).toBeCloseTo(100);
    expect(apr.amount).toBeCloseTo(100);
    expect(jun.amount).toBe(0);
  });

  it('adds ticker to stocks list for payment months only', () => {
    const entry = makeEntry({
      ticker: 'DIV',
      shares: 100,
      annualDividendPerShare: 4,
      dividendFrequency: 'annual',
      exDividendDate: '2024-06-15',
    });
    const result = calculateMonthlyDividends([entry]);
    const jun = result.find(m => m.month === 'June')!;
    const jan = result.find(m => m.month === 'January')!;
    expect(jun.stocks).toContain('DIV');
    expect(jan.stocks).not.toContain('DIV');
  });

  it('accumulates amounts from multiple entries', () => {
    const e1 = makeEntry({ ticker: 'A', shares: 100, annualDividendPerShare: 12, dividendFrequency: 'monthly' });
    const e2 = makeEntry({ ticker: 'B', shares: 50, annualDividendPerShare: 12, dividendFrequency: 'monthly' });
    const result = calculateMonthlyDividends([e1, e2]);
    // e1: 1200/12 = 100/month, e2: 600/12 = 50/month => 150/month
    result.forEach(m => expect(m.amount).toBeCloseTo(150));
  });
});

// ---------------------------------------------------------------------------
// calculateYearlyDividends
// ---------------------------------------------------------------------------
describe('calculateYearlyDividends', () => {
  it('returns an array with one entry for the current year', () => {
    const result = calculateYearlyDividends([]);
    expect(result).toHaveLength(1);
    expect(result[0].year).toBe(new Date().getFullYear());
  });

  it('total amount equals sum of all monthly amounts', () => {
    const entry = makeEntry({ shares: 100, annualDividendPerShare: 4, dividendFrequency: 'quarterly' });
    const result = calculateYearlyDividends([entry]);
    expect(result[0].totalAmount).toBeCloseTo(400);
  });

  it('monthlyBreakdown has 12 entries', () => {
    const result = calculateYearlyDividends([]);
    expect(result[0].monthlyBreakdown).toHaveLength(12);
  });
});

// ---------------------------------------------------------------------------
// calculatePortfolioSummary
// ---------------------------------------------------------------------------
describe('calculatePortfolioSummary', () => {
  it('calculates totalValue as shares * averageCostBasis', () => {
    const entries = [makeEntry({ shares: 100, averageCostBasis: 50 })];
    const summary = calculatePortfolioSummary(entries);
    expect(summary.totalValue).toBe(5000);
    expect(summary.totalCostBasis).toBe(5000);
  });

  it('calculates totalAnnualDividends correctly', () => {
    const entries = [makeEntry({ shares: 100, annualDividendPerShare: 2 })];
    const summary = calculatePortfolioSummary(entries);
    expect(summary.totalAnnualDividends).toBe(200);
  });

  it('calculates dividendYield as percentage', () => {
    // 200 annual / 5000 cost = 4%
    const entries = [makeEntry({ shares: 100, averageCostBasis: 50, annualDividendPerShare: 2 })];
    const summary = calculatePortfolioSummary(entries);
    expect(summary.dividendYield).toBeCloseTo(4);
  });

  it('returns 0 dividendYield for empty portfolio', () => {
    const summary = calculatePortfolioSummary([]);
    expect(summary.dividendYield).toBe(0);
    expect(summary.totalAnnualDividends).toBe(0);
  });

  it('monthlyAverage is totalAnnualDividends / 12', () => {
    const entries = [makeEntry({ shares: 100, annualDividendPerShare: 12 })];
    const summary = calculatePortfolioSummary(entries);
    expect(summary.monthlyAverage).toBeCloseTo(100);
  });

  it('topPerformers is sorted by annualDividend descending and capped at 5', () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ id: String(i), ticker: `T${i}`, shares: i + 1, annualDividendPerShare: i + 1 })
    );
    const summary = calculatePortfolioSummary(entries);
    expect(summary.topPerformers).toHaveLength(5);
    for (let i = 0; i < 4; i++) {
      expect(summary.topPerformers[i].annualDividend).toBeGreaterThanOrEqual(
        summary.topPerformers[i + 1].annualDividend
      );
    }
  });
});

// ---------------------------------------------------------------------------
// formatPercent
// ---------------------------------------------------------------------------
describe('formatPercent', () => {
  it('formats a valid percentage', () => {
    expect(formatPercent(4)).toMatch(/4\.00%/);
  });

  it('returns 0.00% for NaN', () => {
    expect(formatPercent(NaN)).toBe('0.00%');
  });

  it('returns 0.00% for Infinity', () => {
    expect(formatPercent(Infinity)).toBe('0.00%');
  });

  it('returns 0.00% for 0', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatPercent(4.567)).toMatch(/4\.57%/);
  });
});

// ---------------------------------------------------------------------------
// formatNumber
// ---------------------------------------------------------------------------
describe('formatNumber', () => {
  it('formats with 2 decimal places', () => {
    expect(formatNumber(1234.5)).toBe('1,234.50');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0.00');
  });

  it('uses comma separators for thousands', () => {
    expect(formatNumber(1000000)).toBe('1,000,000.00');
  });
});
