export type DividendFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface PortfolioEntry {
  id: string;
  ticker: string;
  companyName: string;
  shares: number;
  averageCostBasis: number;
  annualDividendPerShare: number;
  dividendFrequency: DividendFrequency;
  exDividendDate: string;
  expectedDividendYield?: number;
}

export interface MonthlyDividend {
  month: string;
  year: number;
  amount: number;
  stocks: string[];
}

export interface YearlyDividend {
  year: number;
  totalAmount: number;
  monthlyBreakdown: MonthlyDividend[];
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalAnnualDividends: number;
  dividendYield: number;
  monthlyAverage: number;
  yearlyTotal: number;
  topPerformers: {
    ticker: string;
    annualDividend: number;
    yield: number;
    expectedDividendYield?: number;
  }[];
  monthlyProjection: MonthlyDividend[];
}

export interface Scenario {
  id: string;
  name: string;
  horizonYears: number;
  monthlyContribution: number;
  dividendGrowthRate: number;   // annual rate, e.g. 0.05 = 5%
  reinvestRate: number;         // 0-1, fraction of net dividends reinvested
  taxRate: number;              // 0-1, withheld before reinvestment
  targetMonthlyIncome: number;  // 0 = coverage not shown
  version: 1;
}

export interface ProjectionPoint {
  month: number;               // 1-based; month=1 is next month
  calendarYear: number;
  calendarMonth: number;       // 0-11 (January=0)
  monthlyIncome: number;       // net dividend income this month
  rollingAnnualIncome: number; // annualized (ramp-up corrected: sum * 12/window.length)
  coverageRatio: number;       // (rollingAnnualIncome/12) / targetMonthlyIncome; 0 if target=0
}

export interface ColumnMapping {
  ticker: string;
  companyName: string;
  shares: string;
  averageCostBasis: string;
  annualDividendPerShare: string;
  dividendFrequency: string;
  exDividendDate: string;
  expectedDividendYield: string;
}
