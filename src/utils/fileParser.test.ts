import { describe, it, expect } from 'vitest';
import { detectColumnMapping, getFileExtension, isValidFileType, parseCSV } from './fileParser';

// ---------------------------------------------------------------------------
// getFileExtension
// ---------------------------------------------------------------------------
describe('getFileExtension', () => {
  it('returns lowercase extension', () => {
    expect(getFileExtension('portfolio.CSV')).toBe('csv');
  });

  it('handles xlsx', () => {
    expect(getFileExtension('data.xlsx')).toBe('xlsx');
  });

  it('returns the whole name (lowercased) when there is no dot', () => {
    // split('.').pop() on a dot-free string returns the whole string
    expect(getFileExtension('noextension')).toBe('noextension');
  });

  it('handles files with multiple dots', () => {
    expect(getFileExtension('my.portfolio.data.csv')).toBe('csv');
  });
});

// ---------------------------------------------------------------------------
// isValidFileType
// ---------------------------------------------------------------------------
describe('isValidFileType', () => {
  it('accepts csv', () => {
    expect(isValidFileType('portfolio.csv')).toBe(true);
  });

  it('accepts xlsx', () => {
    expect(isValidFileType('data.xlsx')).toBe(true);
  });

  it('accepts xls', () => {
    expect(isValidFileType('data.xls')).toBe(true);
  });

  it('rejects txt', () => {
    expect(isValidFileType('data.txt')).toBe(false);
  });

  it('rejects pdf', () => {
    expect(isValidFileType('report.pdf')).toBe(false);
  });

  it('rejects files with no extension', () => {
    expect(isValidFileType('readme')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectColumnMapping
// ---------------------------------------------------------------------------
describe('detectColumnMapping', () => {
  it('maps obvious header names', () => {
    const headers = ['Ticker', 'Company Name', 'Shares', 'Cost Basis', 'Annual Dividend', 'Frequency', 'Ex Date', 'Expected Yield'];
    const mapping = detectColumnMapping(headers);
    expect(mapping.ticker).toBe('Ticker');
    expect(mapping.companyName).toBe('Company Name');
    expect(mapping.shares).toBe('Shares');
    expect(mapping.averageCostBasis).toBe('Cost Basis');
    expect(mapping.annualDividendPerShare).toBe('Annual Dividend');
    expect(mapping.dividendFrequency).toBe('Frequency');
    expect(mapping.exDividendDate).toBe('Ex Date');
    expect(mapping.expectedDividendYield).toBe('Expected Yield');
  });

  it('matches by partial keyword (case-insensitive)', () => {
    const headers = ['SYMBOL', 'QTY', 'PURCHASE PRICE', 'DPS', 'PAYOUT', 'RECORD DATE'];
    const mapping = detectColumnMapping(headers);
    expect(mapping.ticker).toBe('SYMBOL');
    expect(mapping.shares).toBe('QTY');
    expect(mapping.averageCostBasis).toBe('PURCHASE PRICE');
    expect(mapping.annualDividendPerShare).toBe('DPS');
    expect(mapping.dividendFrequency).toBe('PAYOUT');
    expect(mapping.exDividendDate).toBe('RECORD DATE');
  });

  it('returns empty object for unrecognized headers', () => {
    const mapping = detectColumnMapping(['FooBar', 'Baz', 'Qux']);
    expect(Object.keys(mapping)).toHaveLength(0);
  });

  it('does not map a field when no keyword matches', () => {
    const mapping = detectColumnMapping(['Ticker']);
    expect(mapping.ticker).toBe('Ticker');
    expect(mapping.shares).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// parseCSV
// ---------------------------------------------------------------------------
describe('parseCSV', () => {
  const mapping = {
    ticker: 'Ticker',
    companyName: 'Company',
    shares: 'Shares',
    averageCostBasis: 'Cost',
    annualDividendPerShare: 'DivPerShare',
    dividendFrequency: 'Frequency',
    exDividendDate: 'ExDate',
    expectedDividendYield: 'ExpYield',
  };

  it('parses a basic CSV and returns portfolio entries', async () => {
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
AAPL,Apple Inc.,100,150,1.00,quarterly,2024-02-09,`;

    const entries = await parseCSV(csv, mapping);
    expect(entries).toHaveLength(1);
    expect(entries[0].ticker).toBe('AAPL');
    expect(entries[0].companyName).toBe('Apple Inc.');
    expect(entries[0].shares).toBe(100);
    expect(entries[0].averageCostBasis).toBe(150);
    expect(entries[0].annualDividendPerShare).toBeCloseTo(1);
    expect(entries[0].dividendFrequency).toBe('quarterly');
  });

  it('filters out rows with no ticker', async () => {
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
,Apple Inc.,100,150,1.00,quarterly,2024-02-09,
MSFT,Microsoft,50,300,3.00,quarterly,2024-02-14,`;

    const entries = await parseCSV(csv, mapping);
    expect(entries).toHaveLength(1);
    expect(entries[0].ticker).toBe('MSFT');
  });

  it('normalizes ticker to uppercase', async () => {
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
aapl,Apple,10,100,1.00,monthly,2024-01-01,`;

    const entries = await parseCSV(csv, mapping);
    expect(entries[0].ticker).toBe('AAPL');
  });

  it('normalizes frequency strings', async () => {
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
VYM,Vanguard,80,105,2.62,Monthly,2024-03-19,`;

    const entries = await parseCSV(csv, mapping);
    expect(entries[0].dividendFrequency).toBe('monthly');
  });

  it('handles semi-annual frequency', async () => {
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
BOND,Bond Fund,50,100,2.00,semi-annual,2024-06-01,`;

    const entries = await parseCSV(csv, mapping);
    expect(entries[0].dividendFrequency).toBe('semi-annual');
  });

  it('handles annual frequency', async () => {
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
ONCE,Annual Fund,50,100,2.00,Annual,2024-06-01,`;

    const entries = await parseCSV(csv, mapping);
    expect(entries[0].dividendFrequency).toBe('annual');
  });

  it('defaults unrecognized frequency to quarterly', async () => {
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
X,Unknown,50,100,2.00,weekly,2024-01-01,`;

    const entries = await parseCSV(csv, mapping);
    expect(entries[0].dividendFrequency).toBe('quarterly');
  });

  it('parses multiple rows', async () => {
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
AAPL,Apple,100,150,1.00,quarterly,2024-02-09,
MSFT,Microsoft,50,300,3.00,quarterly,2024-02-14,
O,Realty Income,200,52,3.08,monthly,2024-01-31,`;

    const entries = await parseCSV(csv, mapping);
    expect(entries).toHaveLength(3);
  });

  it('applies bidirectional DIVe when only expectedDividendYield is given', async () => {
    // cost=100, expectedYield=5 => div/share = (5 * 100) / 100 = 5
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
DIV,Div Co,10,100,0,quarterly,2024-01-01,5`;

    const entries = await parseCSV(csv, mapping);
    expect(entries[0].annualDividendPerShare).toBeCloseTo(5);
    expect(entries[0].expectedDividendYield).toBeCloseTo(5);
  });

  it('assigns a uuid id to each entry', async () => {
    const csv = `Ticker,Company,Shares,Cost,DivPerShare,Frequency,ExDate,ExpYield
AAPL,Apple,100,150,1.00,quarterly,2024-02-09,`;

    const entries = await parseCSV(csv, mapping);
    expect(entries[0].id).toBeTruthy();
    expect(typeof entries[0].id).toBe('string');
  });
});
