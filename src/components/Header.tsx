import { TrendingUp, DollarSign, BarChart3, Upload, Plus, Globe } from 'lucide-react';
import { usePortfolio, useCurrency, type Currency } from '../context/PortfolioContext';
import { calculatePortfolioSummary } from '../utils/calculations';

interface HeaderProps {
  onImportClick: () => void;
  onAddClick: () => void;
}

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'VND', label: 'Vietnamese Dong', symbol: '₫' }
];

export default function Header({ onImportClick, onAddClick }: HeaderProps) {
  const { entries } = usePortfolio();
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const summary = calculatePortfolioSummary(entries);

  return (
    <header className="glass sticky top-0 z-50 border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-green)] to-[var(--color-accent-cyan)] flex items-center justify-center animate-pulse-glow">
                <TrendingUp className="w-5 h-5 text-[var(--color-bg-primary)]" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
                Dividend Tracker
              </h1>
              <p className="text-xs text-[var(--color-text-muted)]">
                {entries.length} stocks in portfolio
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <DollarSign className="w-4 h-4 text-[var(--color-accent-green)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Annual Income</p>
                <p className="text-sm font-mono font-semibold text-[var(--color-accent-green)]">
                  {formatCurrency(summary.totalAnnualDividends)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <BarChart3 className="w-4 h-4 text-[var(--color-accent-amber)]" />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Monthly Avg</p>
                <p className="text-sm font-mono font-semibold text-[var(--color-accent-amber)]">
                  {formatCurrency(summary.monthlyAverage)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Currency Selector */}
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent-cyan)] transition-all duration-200"
                title="Select Currency"
              >
                <Globe className="w-4 h-4" />
                <span className="font-mono text-sm">{currency}</span>
              </button>
              
              {/* Currency Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="px-3 pb-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)] mb-2">
                  Select Currency
                </p>
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr.value}
                    onClick={() => setCurrency(curr.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                      currency === curr.value
                        ? 'bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <span>{curr.label}</span>
                    <span className="font-mono">{curr.symbol}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onImportClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent-green)] transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent-green)] text-[var(--color-bg-primary)] font-medium hover:bg-[var(--color-accent-green)]/90 transition-all duration-200 shadow-lg shadow-[var(--color-accent-green-glow)]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Stock</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
