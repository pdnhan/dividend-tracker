import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { PortfolioEntry } from '../types';
import { generateSampleData } from '../utils/calculations';

export type Currency = 'USD' | 'EUR' | 'VND';

export interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'dividend-tracker-currency';

const CURRENCY_CONFIG: Record<Currency, { symbol: string; locale: string; currency: string }> = {
  USD: { symbol: '$', locale: 'en-US', currency: 'USD' },
  EUR: { symbol: '€', locale: 'de-DE', currency: 'EUR' },
  VND: { symbol: '₫', locale: 'vi-VN', currency: 'VND' }
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'USD' || stored === 'EUR' || stored === 'VND')) {
      return stored as Currency;
    }
    return 'USD';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  }, []);

  const formatCurrency = useCallback((amount: number): string => {
    const config = CURRENCY_CONFIG[currency];
    
    if (currency === 'VND') {
      // VND typically doesn't show decimal places
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, [currency]);

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    formatCurrency,
    currencySymbol: CURRENCY_CONFIG[currency].symbol
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

interface PortfolioContextType {
  entries: PortfolioEntry[];
  addEntry: (entry: Omit<PortfolioEntry, 'id'>) => void;
  updateEntry: (id: string, entry: Partial<PortfolioEntry>) => void;
  updateEntries: (ids: string[], updates: Partial<PortfolioEntry>) => void;
  deleteEntry: (id: string) => void;
  deleteEntries: (ids: string[]) => void;
  importEntries: (entries: PortfolioEntry[], clearExisting?: boolean) => void;
  clearAll: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const PORTFOLIO_STORAGE_KEY = 'dividend-tracker-portfolio';

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<PortfolioEntry[]>(() => {
    const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return generateSampleData();
      }
    }
    return generateSampleData();
  });

  useEffect(() => {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = (entry: Omit<PortfolioEntry, 'id'>) => {
    const newEntry: PortfolioEntry = {
      ...entry,
      id: crypto.randomUUID()
    };
    setEntries(prev => [...prev, newEntry]);
  };

  const updateEntry = (id: string, updates: Partial<PortfolioEntry>) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
  };

  const updateEntries = (ids: string[], updates: Partial<PortfolioEntry>) => {
    setEntries(prev =>
      prev.map(entry =>
        ids.includes(entry.id) ? { ...entry, ...updates } : entry
      )
    );
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const deleteEntries = (ids: string[]) => {
    setEntries(prev => prev.filter(entry => !ids.includes(entry.id)));
  };

  const importEntries = (newEntries: PortfolioEntry[], clearExisting: boolean = false) => {
    setEntries(prev => {
      if (clearExisting) {
        // Clear all existing entries and replace with imported data
        return newEntries.map(entry => ({
          ...entry,
          id: crypto.randomUUID()
        }));
      }
      
      // Merge mode: add only unique tickers
      const existingTickers = new Set(prev.map(e => e.ticker));
      const uniqueNewEntries = newEntries
        .filter(e => !existingTickers.has(e.ticker))
        .map(entry => ({
          ...entry,
          id: crypto.randomUUID()
        }));
      return [...prev, ...uniqueNewEntries];
    });
  };

  const clearAll = () => {
    setEntries([]);
  };

  return (
    <PortfolioContext.Provider
      value={{ 
        entries, 
        addEntry, 
        updateEntry,
        updateEntries,
        deleteEntry, 
        deleteEntries,
        importEntries, 
        clearAll 
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
