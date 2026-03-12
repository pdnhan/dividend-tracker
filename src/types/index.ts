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
