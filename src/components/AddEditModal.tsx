import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { PortfolioEntry, DividendFrequency } from '../types';
import { calculateBidirectionalDIVe } from '../utils/calculations';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEntry?: PortfolioEntry | null;
}

const FREQUENCY_OPTIONS: { value: DividendFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' }
];

const initialFormData: Omit<PortfolioEntry, 'id'> = {
  ticker: '',
  companyName: '',
  shares: 0,
  averageCostBasis: 0,
  annualDividendPerShare: 0,
  dividendFrequency: 'quarterly',
  exDividendDate: new Date().toISOString().split('T')[0],
  expectedDividendYield: undefined
};

export default function AddEditModal({ isOpen, onClose, editEntry }: AddEditModalProps) {
  const { addEntry, updateEntry } = usePortfolio();
  const [formData, setFormData] = useState<Omit<PortfolioEntry, 'id'>>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editEntry) {
      const { id, ...rest } = editEntry;
      setFormData(rest);
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [editEntry, isOpen]);

  const handleChange = (field: keyof Omit<PortfolioEntry, 'id'>, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.ticker.trim()) {
      newErrors.ticker = 'Ticker is required';
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (formData.shares <= 0) {
      newErrors.shares = 'Shares must be greater than 0';
    }
    if (formData.averageCostBasis < 0) {
      newErrors.averageCostBasis = 'Cost basis cannot be negative';
    }
    if (formData.annualDividendPerShare < 0) {
      newErrors.annualDividendPerShare = 'Dividend cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    // Apply bidirectional calculation before saving
    const { expectedDividendYield, annualDividendPerShare } = calculateBidirectionalDIVe(
      formData.expectedDividendYield,
      formData.annualDividendPerShare,
      formData.averageCostBasis
    );
    
    const dataToSave = {
      ...formData,
      expectedDividendYield,
      annualDividendPerShare
    };
    
    if (editEntry) {
      updateEntry(editEntry.id, dataToSave);
    } else {
      addEntry(dataToSave);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {editEntry ? 'Edit Stock' : 'Add New Stock'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Ticker Symbol *
              </label>
              <input
                type="text"
                value={formData.ticker}
                onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                placeholder="AAPL"
                className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-lg text-[var(--color-text-primary)] font-mono focus:outline-none transition-colors ${
                  errors.ticker 
                    ? 'border-[var(--color-accent-rose)]' 
                    : 'border-[var(--color-border)] focus:border-[var(--color-accent-green)]'
                }`}
              />
              {errors.ticker && (
                <p className="mt-1 text-xs text-[var(--color-accent-rose)]">{errors.ticker}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Dividend Frequency
              </label>
              <select
                value={formData.dividendFrequency}
                onChange={(e) => handleChange('dividendFrequency', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-green)]"
              >
                {FREQUENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Apple Inc."
              className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-lg text-[var(--color-text-primary)] focus:outline-none transition-colors ${
                errors.companyName 
                  ? 'border-[var(--color-accent-rose)]' 
                  : 'border-[var(--color-border)] focus:border-[var(--color-accent-green)]'
              }`}
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-[var(--color-accent-rose)]">{errors.companyName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Number of Shares *
              </label>
              <input
                type="number"
                value={formData.shares || ''}
                onChange={(e) => handleChange('shares', parseFloat(e.target.value) || 0)}
                placeholder="100"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-lg text-[var(--color-text-primary)] font-mono focus:outline-none transition-colors ${
                  errors.shares 
                    ? 'border-[var(--color-accent-rose)]' 
                    : 'border-[var(--color-border)] focus:border-[var(--color-accent-green)]'
                }`}
              />
              {errors.shares && (
                <p className="mt-1 text-xs text-[var(--color-accent-rose)]">{errors.shares}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Avg Cost Basis ($)
              </label>
              <input
                type="number"
                value={formData.averageCostBasis || ''}
                onChange={(e) => handleChange('averageCostBasis', parseFloat(e.target.value) || 0)}
                placeholder="150.00"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-lg text-[var(--color-text-primary)] font-mono focus:outline-none transition-colors ${
                  errors.averageCostBasis 
                    ? 'border-[var(--color-accent-rose)]' 
                    : 'border-[var(--color-border)] focus:border-[var(--color-accent-green)]'
                }`}
              />
              {errors.averageCostBasis && (
                <p className="mt-1 text-xs text-[var(--color-accent-rose)]">{errors.averageCostBasis}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Annual Dividend/Share ($)
              </label>
              <input
                type="number"
                value={formData.annualDividendPerShare || ''}
                onChange={(e) => handleChange('annualDividendPerShare', parseFloat(e.target.value) || 0)}
                placeholder="2.50"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-lg text-[var(--color-text-primary)] font-mono focus:outline-none transition-colors ${
                  errors.annualDividendPerShare 
                    ? 'border-[var(--color-accent-rose)]' 
                    : 'border-[var(--color-border)] focus:border-[var(--color-accent-green)]'
                }`}
              />
              {errors.annualDividendPerShare && (
                <p className="mt-1 text-xs text-[var(--color-accent-rose)]">{errors.annualDividendPerShare}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Ex-Dividend Date
              </label>
              <input
                type="date"
                value={formData.exDividendDate}
                onChange={(e) => handleChange('exDividendDate', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-green)]"
              />
            </div>
          </div>

          {/* DIVe - Expected Dividend Yield */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Expected Dividend Yield (DIVe) %
            </label>
            <input
              type="number"
              value={formData.expectedDividendYield ?? ''}
              onChange={(e) => handleChange('expectedDividendYield', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Auto-calculated"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-accent-green)]"
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Optional: Set expected yield to auto-calculate dividend/share, or leave blank to use the dividend/share value
            </p>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Annual Dividend Preview</p>
            <p className="text-2xl font-mono font-bold text-[var(--color-accent-green)]">
              ${(formData.shares * formData.annualDividendPerShare).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-accent-green)] text-[var(--color-bg-primary)] font-medium hover:bg-[var(--color-accent-green)]/90 transition-colors shadow-lg shadow-[var(--color-accent-green-glow)]"
            >
              <Plus className="w-4 h-4" />
              {editEntry ? 'Update Stock' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
