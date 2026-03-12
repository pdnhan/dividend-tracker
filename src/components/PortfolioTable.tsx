import React, { useState } from 'react';
import { 
  Pencil, Trash2, Save, X, ChevronUp, ChevronDown, 
  Search, Filter, CheckSquare, Square, Edit3
} from 'lucide-react';
import { usePortfolio, useCurrency } from '../context/PortfolioContext';
import type { 
  PortfolioEntry, 
  DividendFrequency 
} from '../types';
import { 
  formatPercent, 
  calculateAnnualDividend, 
  calculateDividendYield,
  calculateExpectedDividendYield,
  calculateBidirectionalDIVe
} from '../utils/calculations';

type SortField = 'ticker' | 'companyName' | 'shares' | 'averageCostBasis' | 'annualDividendPerShare' | 'dividendFrequency' | 'expectedDividendYield';
type SortDirection = 'asc' | 'desc';

const FREQUENCY_OPTIONS: { value: DividendFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' }
];

interface EditableRowProps {
  entry: PortfolioEntry;
  onSave: (entry: Partial<PortfolioEntry>) => void;
  onCancel: () => void;
}

function EditableRow({ entry, onSave, onCancel }: EditableRowProps) {
  const [formData, setFormData] = useState<PortfolioEntry>({ ...entry });

  // Calculate the expected DIVe for display as placeholder when field is empty
  const calculatedDIVe = calculateExpectedDividendYield({
    ...entry,
    annualDividendPerShare: formData.annualDividendPerShare,
    expectedDividendYield: formData.expectedDividendYield
  });

  const handleChange = (field: keyof PortfolioEntry, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Apply bidirectional calculation before saving
    const { expectedDividendYield, annualDividendPerShare } = calculateBidirectionalDIVe(
      formData.expectedDividendYield,
      formData.annualDividendPerShare,
      formData.averageCostBasis
    );

    onSave({
      ...formData,
      expectedDividendYield,
      annualDividendPerShare
    });
  };

  return (
    <tr className="bg-[var(--color-bg-tertiary)]/50">
      <td className="py-3 px-4">
        <input
          type="text"
          value={formData.ticker}
          onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
          className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-mono focus:border-[var(--color-accent-green)] focus:outline-none"
        />
      </td>
      <td className="py-3 px-4">
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => handleChange('companyName', e.target.value)}
          className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-green)] focus:outline-none"
        />
      </td>
      <td className="py-3 px-4">
        <input
          type="number"
          value={formData.shares}
          onChange={(e) => handleChange('shares', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-mono focus:border-[var(--color-accent-green)] focus:outline-none"
          step="0.01"
          min="0"
        />
      </td>
      <td className="py-3 px-4">
        <input
          type="number"
          value={formData.averageCostBasis}
          onChange={(e) => handleChange('averageCostBasis', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-mono focus:border-[var(--color-accent-green)] focus:outline-none"
          step="0.01"
          min="0"
        />
      </td>
      <td className="py-3 px-4">
        <input
          type="number"
          value={formData.annualDividendPerShare}
          onChange={(e) => handleChange('annualDividendPerShare', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-mono focus:border-[var(--color-accent-green)] focus:outline-none"
          step="0.01"
          min="0"
        />
      </td>
      <td className="py-3 px-4">
        <select
          value={formData.dividendFrequency}
          onChange={(e) => handleChange('dividendFrequency', e.target.value)}
          className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-green)] focus:outline-none"
        >
          {FREQUENCY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td className="py-3 px-4">
        <input
          type="date"
          value={formData.exDividendDate}
          onChange={(e) => handleChange('exDividendDate', e.target.value)}
          className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-green)] focus:outline-none"
        />
      </td>
      <td className="py-3 px-4">
        <div className="relative">
          <input
            type="number"
            value={formData.expectedDividendYield ?? ''}
            onChange={(e) => handleChange('expectedDividendYield', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-mono focus:border-[var(--color-accent-green)] focus:outline-none"
            step="0.01"
            min="0"
            placeholder={calculatedDIVe > 0 ? calculatedDIVe.toFixed(2) : 'Auto'}
          />
          {formData.expectedDividendYield === undefined && calculatedDIVe > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] pointer-events-none">
              ≈{calculatedDIVe.toFixed(1)}%
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={handleSave}
            className="p-2 rounded-lg text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green-dim)] transition-colors"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-[var(--color-accent-rose)] hover:bg-[var(--color-accent-rose)]/10 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface BulkEditModalProps {
  isOpen: boolean;
  selectedIds: string[];
  entries: PortfolioEntry[];
  onClose: () => void;
  onSave: (updates: Partial<PortfolioEntry>, applyFields: Record<string, boolean>) => void;
}

function BulkEditModal({ isOpen, selectedIds, onClose, onSave }: BulkEditModalProps) {
  const [updates, setUpdates] = useState<Partial<PortfolioEntry>>({});
  const [applyFields, setApplyFields] = useState<Record<string, boolean>>({
    dividendFrequency: false,
    exDividendDate: false,
    expectedDividendYield: false,
    annualDividendPerShare: false
  });

  if (!isOpen) return null;

  const handleApply = () => {
    onSave(updates, applyFields);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Bulk Edit
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Editing {selectedIds.length} selected entries
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Frequency */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="applyFrequency"
              checked={applyFields.dividendFrequency}
              onChange={(e) => setApplyFields(prev => ({ ...prev, dividendFrequency: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent-green)] focus:ring-[var(--color-accent-green)]"
            />
            <div className="flex-1">
              <label htmlFor="applyFrequency" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Update Dividend Frequency
              </label>
              <select
                value={updates.dividendFrequency || ''}
                onChange={(e) => setUpdates(prev => ({ ...prev, dividendFrequency: e.target.value as DividendFrequency }))}
                disabled={!applyFields.dividendFrequency}
                className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-green)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select frequency...</option>
                {FREQUENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ex-Dividend Date */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="applyExDate"
              checked={applyFields.exDividendDate}
              onChange={(e) => setApplyFields(prev => ({ ...prev, exDividendDate: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent-green)] focus:ring-[var(--color-accent-green)]"
            />
            <div className="flex-1">
              <label htmlFor="applyExDate" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Update Ex-Dividend Date
              </label>
              <input
                type="date"
                value={updates.exDividendDate || ''}
                onChange={(e) => setUpdates(prev => ({ ...prev, exDividendDate: e.target.value }))}
                disabled={!applyFields.exDividendDate}
                className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-green)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* DIVe - Expected Dividend Yield */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="applyDIVe"
              checked={applyFields.expectedDividendYield}
              onChange={(e) => setApplyFields(prev => ({ ...prev, expectedDividendYield: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent-green)] focus:ring-[var(--color-accent-green)]"
            />
            <div className="flex-1">
              <label htmlFor="applyDIVe" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Update Expected Dividend Yield (DIVe %)
              </label>
              <input
                type="number"
                value={updates.expectedDividendYield ?? ''}
                onChange={(e) => setUpdates(prev => ({ ...prev, expectedDividendYield: e.target.value ? parseFloat(e.target.value) : undefined }))}
                disabled={!applyFields.expectedDividendYield}
                placeholder="e.g., 5.0"
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-mono focus:border-[var(--color-accent-green)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                If only DIVe is checked, div/share will be auto-calculated
              </p>
            </div>
          </div>

          {/* Annual Dividend Per Share */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="applyDivShare"
              checked={applyFields.annualDividendPerShare}
              onChange={(e) => setApplyFields(prev => ({ ...prev, annualDividendPerShare: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent-green)] focus:ring-[var(--color-accent-green)]"
            />
            <div className="flex-1">
              <label htmlFor="applyDivShare" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Update Annual Dividend/Share ($)
              </label>
              <input
                type="number"
                value={updates.annualDividendPerShare ?? ''}
                onChange={(e) => setUpdates(prev => ({ ...prev, annualDividendPerShare: e.target.value ? parseFloat(e.target.value) : 0 }))}
                disabled={!applyFields.annualDividendPerShare}
                placeholder="e.g., 2.50"
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-mono focus:border-[var(--color-accent-green)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                If only div/share is checked, DIVe will be auto-calculated
              </p>
            </div>
          </div>

          <div className="pt-4 text-sm text-[var(--color-text-muted)]">
            <p>Note: When both DIVe and div/share are checked, values are saved as-is. When only one is checked, the other will be auto-calculated using each stock's average cost basis.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--color-accent-cyan)] text-[var(--color-bg-primary)] font-medium hover:bg-[var(--color-accent-cyan)]/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioTable() {
  const { entries, updateEntry, deleteEntry, deleteEntries } = usePortfolio();
  const { formatCurrency } = useCurrency();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('ticker');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<DividendFrequency | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredEntries = entries
    .filter(entry => {
      const matchesSearch = 
        entry.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFrequency = 
        filterFrequency === 'all' || 
        entry.dividendFrequency === filterFrequency;
      return matchesSearch && matchesFrequency;
    })
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'ticker' || sortField === 'companyName') {
        return multiplier * a[sortField].localeCompare(b[sortField]);
      }
      const numA = a[sortField] as number;
      const numB = b[sortField] as number;
      return multiplier * (numA - numB);
    });

  const allSelected = filteredEntries.length > 0 && filteredEntries.every(e => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntries.map(e => e.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected entries?`)) {
      deleteEntries(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBulkEdit = (updates: Partial<PortfolioEntry>, applyFields: Record<string, boolean>) => {
    // Get the selected entries to apply individual calculations
    const selectedEntries = entries.filter(e => selectedIds.has(e.id));
    
    // Apply bidirectional calculation for each entry individually
    const processedUpdates = selectedEntries.map(entry => {
      const entryUpdates = { ...updates };
      
      // Only apply calculation if the specific field is being updated
      if (applyFields.expectedDividendYield && !applyFields.annualDividendPerShare) {
        // DIVe provided but not div/share - calculate div/share for each entry
        const { annualDividendPerShare } = calculateBidirectionalDIVe(
          entryUpdates.expectedDividendYield,
          entry.annualDividendPerShare || 0,
          entry.averageCostBasis
        );
        entryUpdates.annualDividendPerShare = annualDividendPerShare;
      } else if (applyFields.annualDividendPerShare && !applyFields.expectedDividendYield) {
        // div/share provided but not DIVe - calculate DIVe for each entry
        const { expectedDividendYield } = calculateBidirectionalDIVe(
          entry.expectedDividendYield,
          entryUpdates.annualDividendPerShare || 0,
          entry.averageCostBasis
        );
        entryUpdates.expectedDividendYield = expectedDividendYield;
      }
      
      return { id: entry.id, updates: entryUpdates };
    });
    
    // Apply updates to each entry
    processedUpdates.forEach(({ id, updates }) => {
      updateEntry(id, updates);
    });
    
    setSelectedIds(new Set());
    setIsBulkEditOpen(false);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 ml-1" />
      : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-in stagger-8">
      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="p-4 bg-[var(--color-accent-cyan)]/10 border-b border-[var(--color-accent-cyan)]/30 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--color-accent-cyan)]">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkEditOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-cyan)] hover:border-[var(--color-accent-cyan)] transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Bulk Edit</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-accent-rose)]/20 border border-[var(--color-accent-rose)]/30 text-[var(--color-accent-rose)] hover:bg-[var(--color-accent-rose)]/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Controls */}
      <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by ticker or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent-green)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value as DividendFrequency | 'all')}
            className="px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-green)] focus:outline-none"
          >
            <option value="all">All Frequencies</option>
            {FREQUENCY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)]">
              <th className="text-left py-4 px-4 w-12">
                <button
                  onClick={handleSelectAll}
                  className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  title={allSelected ? 'Deselect all' : 'Select all'}
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-[var(--color-accent-green)]" />
                  ) : (
                    <Square className="w-5 h-5 text-[var(--color-text-muted)]" />
                  )}
                </button>
              </th>
              <th 
                className="text-left py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                onClick={() => handleSort('ticker')}
              >
                <span className="flex items-center">
                  Ticker <SortIcon field="ticker" />
                </span>
              </th>
              <th 
                className="text-left py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                onClick={() => handleSort('companyName')}
              >
                <span className="flex items-center">
                  Company <SortIcon field="companyName" />
                </span>
              </th>
              <th 
                className="text-right py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                onClick={() => handleSort('shares')}
              >
                <span className="flex items-center justify-end">
                  Shares <SortIcon field="shares" />
                </span>
              </th>
              <th 
                className="text-right py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                onClick={() => handleSort('averageCostBasis')}
              >
                <span className="flex items-center justify-end">
                  Avg Cost <SortIcon field="averageCostBasis" />
                </span>
              </th>
              <th 
                className="text-right py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                onClick={() => handleSort('annualDividendPerShare')}
              >
                <span className="flex items-center justify-end">
                  Div/Share <SortIcon field="annualDividendPerShare" />
                </span>
              </th>
              <th 
                className="text-center py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                onClick={() => handleSort('dividendFrequency')}
              >
                <span className="flex items-center justify-center">
                  Frequency <SortIcon field="dividendFrequency" />
                </span>
              </th>
              <th className="text-left py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Ex-Date
              </th>
              <th 
                className="text-right py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                onClick={() => handleSort('expectedDividendYield')}
              >
                <span className="flex items-center justify-end">
                  DIVe <SortIcon field="expectedDividendYield" />
                </span>
              </th>
              <th className="text-right py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Annual
              </th>
              <th className="text-right py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Yield
              </th>
              <th className="text-center py-4 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, index) => (
              <React.Fragment key={entry.id}>
                {editingId === entry.id ? (
                  <EditableRow
                    entry={entry}
                    onSave={(updates) => {
                      updateEntry(entry.id, updates);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr 
                    className={`border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-tertiary)]/30 transition-colors animate-slide-in ${
                      selectedIds.has(entry.id) ? 'bg-[var(--color-accent-green)]/5' : ''
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleSelectOne(entry.id)}
                        className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
                        title={selectedIds.has(entry.id) ? 'Deselect' : 'Select'}
                      >
                        {selectedIds.has(entry.id) ? (
                          <CheckSquare className="w-5 h-5 text-[var(--color-accent-green)]" />
                        ) : (
                          <Square className="w-5 h-5 text-[var(--color-text-muted)]" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-semibold text-[var(--color-accent-green)]">
                        {entry.ticker}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[var(--color-text-secondary)]">
                      {entry.companyName}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[var(--color-text-primary)]">
                      {entry.shares.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[var(--color-text-secondary)]">
                      {formatCurrency(entry.averageCostBasis)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[var(--color-text-secondary)]">
                      {formatCurrency(entry.annualDividendPerShare)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        entry.dividendFrequency === 'monthly'
                          ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                          : entry.dividendFrequency === 'quarterly'
                          ? 'bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)]'
                          : entry.dividendFrequency === 'semi-annual'
                          ? 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]'
                          : 'bg-[var(--color-accent-rose)]/20 text-[var(--color-accent-rose)]'
                      }`}>
                        {FREQUENCY_OPTIONS.find(f => f.value === entry.dividendFrequency)?.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[var(--color-text-muted)] font-mono text-sm">
                      {new Date(entry.exDividendDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[var(--color-accent-amber)]">
                      {formatPercent(calculateExpectedDividendYield(entry))}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-[var(--color-accent-green)]">
                      {formatCurrency(calculateAnnualDividend(entry))}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[var(--color-text-secondary)]">
                      {formatPercent(calculateDividendYield(entry))}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingId(entry.id)}
                          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this entry?')) {
                              deleteEntry(entry.id);
                            }
                          }}
                          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent-rose)] hover:bg-[var(--color-accent-rose)]/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEntries.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-[var(--color-text-muted)]">No stocks found matching your criteria.</p>
        </div>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditOpen}
        selectedIds={Array.from(selectedIds)}
        entries={entries}
        onClose={() => setIsBulkEditOpen(false)}
        onSave={handleBulkEdit}
      />
    </div>
  );
}
