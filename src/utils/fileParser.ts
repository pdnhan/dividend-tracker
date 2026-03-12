import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { PortfolioEntry, ColumnMapping, DividendFrequency } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateBidirectionalDIVe } from './calculations';

function normalizeFrequency(freq: string): DividendFrequency {
  const normalized = freq.toLowerCase().trim();
  if (normalized.includes('month')) return 'monthly';
  if (normalized.includes('quarter')) return 'quarterly';
  if (normalized.includes('semi') || normalized.includes('semi-annual')) return 'semi-annual';
  if (normalized.includes('year') || normalized.includes('annual')) return 'annual';
  return 'quarterly';
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Fall through
  }
  
  return new Date().toISOString().split('T')[0];
}

function mapRowToEntry(row: Record<string, string>, mapping: ColumnMapping): PortfolioEntry {
  const getValue = (key: keyof ColumnMapping): string => {
    const mappedKey = mapping[key];
    return row[mappedKey] || row[mappedKey?.toLowerCase()] || '';
  };

  const ticker = getValue('ticker').toUpperCase();
  const companyName = getValue('companyName');
  const shares = parseFloat(getValue('shares')) || 0;
  const averageCostBasis = parseFloat(getValue('averageCostBasis')) || 0;
  const annualDividendPerShare = parseFloat(getValue('annualDividendPerShare')) || 0;
  const dividendFrequency = normalizeFrequency(getValue('dividendFrequency'));
  const exDividendDate = parseDate(getValue('exDividendDate'));
  const expectedDividendYield = getValue('expectedDividendYield') 
    ? parseFloat(getValue('expectedDividendYield')) 
    : undefined;

  // Apply bidirectional calculation: if only one of DIVe or div/share is provided,
  // calculate the other based on averageCostBasis
  const { expectedDividendYield: calculatedDIVe, annualDividendPerShare: calculatedDivShare } = 
    calculateBidirectionalDIVe(expectedDividendYield, annualDividendPerShare, averageCostBasis);

  return {
    id: uuidv4(),
    ticker,
    companyName,
    shares,
    averageCostBasis,
    annualDividendPerShare: calculatedDivShare,
    dividendFrequency,
    exDividendDate,
    expectedDividendYield: calculatedDIVe
  };
}

export function parseCSV(
  content: string,
  mapping: Partial<ColumnMapping>
): Promise<PortfolioEntry[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, string>[];
          const entries = data
            .map((row) => mapRowToEntry(row, mapping as ColumnMapping))
            .filter((entry) => entry.ticker);
          
          resolve(entries);
        } catch (err: unknown) {
          reject(err);
        }
      },
      error: (err: Error) => reject(err)
    });
  });
}

export function parseExcel(
  arrayBuffer: ArrayBuffer,
  mapping: Partial<ColumnMapping>
): Promise<PortfolioEntry[]> {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
      
      const entries = data
        .map((row) => mapRowToEntry(row, mapping as ColumnMapping))
        .filter((entry) => entry.ticker);
      
      resolve(entries);
    } catch (err) {
      reject(err);
    }
  });
}

export function detectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  const patterns: Record<keyof ColumnMapping, string[]> = {
    ticker: ['ticker', 'symbol', 'stock', 'code'],
    companyName: ['company', 'name', 'company name', 'stock name', 'security'],
    shares: ['shares', 'quantity', 'qty', 'units', 'holding'],
    averageCostBasis: ['cost', 'basis', 'average cost', 'avg cost', 'price', 'purchase price', 'cost basis'],
    annualDividendPerShare: ['dividend', 'annual dividend', 'div', 'dps', 'dividend per share'],
    dividendFrequency: ['frequency', 'div frequency', 'payout', 'frequency'],
    exDividendDate: ['ex', 'ex-date', 'ex dividend', 'ex date', 'record date'],
    expectedDividendYield: ['dive', 'expected', 'expected yield', 'div yield', 'yield %', 'exp yield']
  };
  
  for (const [field, keywords] of Object.entries(patterns)) {
    const index = normalizedHeaders.findIndex(h => 
      keywords.some(k => h.includes(k))
    );
    if (index !== -1) {
      mapping[field as keyof ColumnMapping] = headers[index];
    }
  }
  
  return mapping;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['csv', 'xlsx', 'xls'].includes(ext);
}
