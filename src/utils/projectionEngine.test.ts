import { describe, it, expect } from 'vitest';
import { runProjection, calculateIncomeToday } from './projectionEngine';
import type { PortfolioEntry, Scenario } from '../types';

const BASE_SCENARIO: Scenario = {
  id: 'test',
  name: 'Test',
  horizonYears: 1,
  monthlyContribution: 0,
  dividendGrowthRate: 0,
  reinvestRate: 0,
  taxRate: 0,
  targetMonthlyIncome: 0,
  version: 1,
};

const MONTHLY_HOLDING: PortfolioEntry = {
  id: 'h1',
  ticker: 'O',
  companyName: 'Realty Income',
  shares: 100,
  averageCostBasis: 50,
  annualDividendPerShare: 3.00,
  dividendFrequency: 'monthly',
  exDividendDate: '2024-01-15',
};

describe('runProjection', () => {
  it('returns correct number of points for horizonYears', () => {
    const points = runProjection([MONTHLY_HOLDING], { ...BASE_SCENARIO, horizonYears: 3 });
    expect(points).toHaveLength(36);
  });

  it('returns all-zero points for empty portfolio', () => {
    const points = runProjection([], BASE_SCENARIO);
    expect(points).toHaveLength(12);
    points.forEach(p => {
      expect(p.monthlyIncome).toBe(0);
      expect(p.rollingAnnualIncome).toBe(0);
      expect(p.coverageRatio).toBe(0);
    });
  });

  it('computes correct monthly income for monthly payer with no tax or growth', () => {
    // 100 shares * $3/yr / 12 months = $25/month
    const points = runProjection([MONTHLY_HOLDING], BASE_SCENARIO);
    expect(points[0].monthlyIncome).toBeCloseTo(25, 5);
    // Rolling window stabilizes at 12 months: annualized = 25 * 12 = 300
    expect(points[11].rollingAnnualIncome).toBeCloseTo(300, 2);
  });

  it('applies tax rate correctly', () => {
    const points = runProjection([MONTHLY_HOLDING], { ...BASE_SCENARIO, taxRate: 0.15 });
    // net = 25 * (1 - 0.15) = 21.25
    expect(points[0].monthlyIncome).toBeCloseTo(21.25, 5);
  });

  it('clamps horizonYears=0 to 1 (12 points)', () => {
    const points = runProjection([MONTHLY_HOLDING], { ...BASE_SCENARIO, horizonYears: 0 });
    expect(points).toHaveLength(12);
  });

  it('handles holding with averageCostBasis=0 without throwing; coverageRatio=0 when targetMonthlyIncome=0', () => {
    const zeroCostHolding: PortfolioEntry = {
      ...MONTHLY_HOLDING,
      id: 'h2',
      averageCostBasis: 0,
    };
    expect(() => runProjection([zeroCostHolding], BASE_SCENARIO)).not.toThrow();
    const points = runProjection([zeroCostHolding], BASE_SCENARIO);
    points.forEach(p => expect(p.coverageRatio).toBe(0));
  });

  it('handles invalid exDividendDate gracefully (no payout months, no throw)', () => {
    const badDateHolding: PortfolioEntry = {
      ...MONTHLY_HOLDING,
      id: 'h3',
      exDividendDate: 'not-a-date',
      dividendFrequency: 'quarterly',
    };
    // getDividendMonths with bad date: new Date('not-a-date').getMonth() returns NaN
    // Engine should not throw
    expect(() => runProjection([badDateHolding], BASE_SCENARIO)).not.toThrow();
  });

  it('coverageRatio is rollingAnnualIncome/12 / targetMonthlyIncome', () => {
    const scenario = { ...BASE_SCENARIO, targetMonthlyIncome: 250 };
    const points = runProjection([MONTHLY_HOLDING], scenario);
    // After 12 months: rollingAnnualIncome = 300, expected monthly = 25
    // coverageRatio = (300/12) / 250 = 25/250 = 0.1
    expect(points[11].coverageRatio).toBeCloseTo(0.1, 4);
  });
});

describe('calculateIncomeToday', () => {
  it('returns 0 for empty portfolio', () => {
    expect(calculateIncomeToday([], BASE_SCENARIO)).toBe(0);
  });

  it('returns net monthly income when holdings pay in current month', () => {
    // Force "current month" to January (index 0); MONTHLY_HOLDING pays every month
    const now = new Date(2025, 0, 15); // January 15, 2025
    const income = calculateIncomeToday([MONTHLY_HOLDING], BASE_SCENARIO, now);
    // monthly payer: 100 shares * $3/yr / 12 = $25
    expect(income).toBeCloseTo(25, 5);
  });
});
