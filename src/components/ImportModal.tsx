import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';
import { usePortfolio, useCurrency } from '../context/PortfolioContext';
import type { PortfolioEntry, ColumnMapping } from '../types';
import { 
  parseCSV, 
  parseExcel, 
  detectColumnMapping, 
  getFileExtension, 
  isValidFileType 
} from '../utils/fileParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_MAPPING: ColumnMapping = {
  ticker: 'Ticker',
  companyName: 'Company Name',
  shares: 'Shares',
  averageCostBasis: 'Cost Basis',
  annualDividendPerShare: 'Annual Dividend',
  dividendFrequency: 'Frequency',
  exDividendDate: 'Ex-Date',
  expectedDividendYield: 'DIVe'
};

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { importEntries } = usePortfolio();
  const { formatCurrency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(DEFAULT_MAPPING);
  const [parsedEntries, setParsedEntries] = useState<PortfolioEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [clearExisting, setClearExisting] = useState(true);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setMapping(DEFAULT_MAPPING);
    setParsedEntries([]);
    setError(null);
    setClearExisting(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!isValidFileType(selectedFile.name)) {
      setError('Please select a CSV or Excel (.xlsx/.xls) file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    try {
      const ext = getFileExtension(selectedFile.name);
      
      if (ext === 'csv') {
        const text = await selectedFile.text();
        const result = await new Promise<{ data: Record<string, string>[] }>((resolve) => {
          import('papaparse').then(({ default: Papa }) => {
            const result = Papa.parse(text, { header: true, preview: 1 });
            resolve(result as { data: Record<string, string>[] });
          });
        });
        
        if (result.data.length > 0) {
          const detectedHeaders = Object.keys(result.data[0]);
          setHeaders(detectedHeaders);
          const detected = detectColumnMapping(detectedHeaders);
          setMapping({ ...DEFAULT_MAPPING, ...detected });
        }
      } else {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = await import('xlsx').then(({ read }) => read(buffer, { type: 'array' }));
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = await import('xlsx').then(({ utils }) => utils.sheet_to_json<Record<string, string>>(sheet));
        
        if (data.length > 0) {
          const detectedHeaders = Object.keys(data[0]);
          setHeaders(detectedHeaders);
          const detected = detectColumnMapping(detectedHeaders);
          setMapping({ ...DEFAULT_MAPPING, ...detected });
        }
      }
      
      setStep('mapping');
    } catch (err) {
      setError('Failed to parse file. Please check the format.');
      console.error(err);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const ext = getFileExtension(file.name);
      let entries: PortfolioEntry[];

      if (ext === 'csv') {
        const text = await file.text();
        entries = await parseCSV(text, mapping);
      } else {
        const buffer = await file.arrayBuffer();
        entries = await parseExcel(buffer, mapping);
      }

      setParsedEntries(entries);
      setStep('preview');
    } catch (err) {
      setError('Failed to parse file with current mapping. Please adjust column mapping.');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleImport = () => {
    importEntries(parsedEntries, clearExisting);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl animate-fade-in overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Import Portfolio
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {step === 'upload' && 'Upload a CSV or Excel file'}
              {step === 'mapping' && 'Map columns to data fields'}
              {step === 'preview' && 'Review imported data'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            {['upload', 'mapping', 'preview'].map((s, index) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  step === s 
                    ? 'bg-[var(--color-accent-green)] text-[var(--color-bg-primary)]' 
                    : ['upload', 'mapping', 'preview'].indexOf(step) > index
                    ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                }`}>
                  {['upload', 'mapping', 'preview'].indexOf(step) > index ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-3.5 h-3.5 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                  )}
                  <span className="capitalize">{s}</span>
                </div>
                {index < 2 && (
                  <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-[var(--color-accent-rose)]/10 border border-[var(--color-accent-rose)]/30 rounded-lg text-[var(--color-accent-rose)]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-12 text-center cursor-pointer hover:border-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)]/5 transition-colors"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[var(--color-accent-green)]" />
                </div>
                <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Supports CSV, XLSX, and XLS files
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="mt-8 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Expected columns:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(DEFAULT_MAPPING).map(col => (
                    <span 
                      key={col}
                      className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded text-xs text-[var(--color-text-secondary)] font-mono"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-[var(--color-accent-green)]" />
                <span className="font-medium text-[var(--color-text-primary)]">
                  {file?.name}
                </span>
              </div>

              <div className="space-y-3">
                {(Object.keys(DEFAULT_MAPPING) as (keyof ColumnMapping)[]).map(field => (
                  <div key={field} className="flex items-center gap-4">
                    <label className="w-40 text-sm font-medium text-[var(--color-text-secondary)] capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <select
                      value={mapping[field]}
                      onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                      className="flex-1 px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-green)]"
                    >
                      <option value="">-- Select column --</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Clear Existing Toggle */}
              <div className="flex items-start gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
                <input
                  type="checkbox"
                  id="clearExisting"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent-green)] focus:ring-[var(--color-accent-green)]"
                />
                <div className="flex-1">
                  <label htmlFor="clearExisting" className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                    <Trash2 className="w-4 h-4 text-[var(--color-accent-rose)]" />
                    Clear existing portfolio before import
                  </label>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {clearExisting 
                      ? 'All existing entries (including sample data) will be removed and replaced with the imported data.'
                      : 'Imported entries will be merged with your existing portfolio. Duplicate tickers will be skipped.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--color-accent-green)]/10 rounded-lg border border-[var(--color-accent-green)]/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[var(--color-accent-green)]" />
                  <span className="text-[var(--color-accent-green)]">
                    Found {parsedEntries.length} valid entries
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-bg-secondary)]">
                    <tr>
                      <th className="text-left py-2 px-3 text-[var(--color-text-muted)]">Ticker</th>
                      <th className="text-left py-2 px-3 text-[var(--color-text-muted)]">Company</th>
                      <th className="text-right py-2 px-3 text-[var(--color-text-muted)]">Shares</th>
                      <th className="text-right py-2 px-3 text-[var(--color-text-muted)]">Cost</th>
                      <th className="text-right py-2 px-3 text-[var(--color-text-muted)]">Div/Share</th>
                      <th className="text-center py-2 px-3 text-[var(--color-text-muted)]">Freq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedEntries.slice(0, 10).map((entry, index) => (
                      <tr key={index} className="border-t border-[var(--color-border)]">
                        <td className="py-2 px-3 font-mono text-[var(--color-accent-green)]">{entry.ticker}</td>
                        <td className="py-2 px-3 text-[var(--color-text-secondary)]">{entry.companyName}</td>
                        <td className="py-2 px-3 text-right font-mono">{entry.shares}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(entry.averageCostBasis)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(entry.annualDividendPerShare)}</td>
                        <td className="py-2 px-3 text-center text-[var(--color-text-muted)]">{entry.dividendFrequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedEntries.length > 10 && (
                  <div className="p-2 text-center text-sm text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
                    ...and {parsedEntries.length - 10} more entries
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <button
            onClick={() => {
              if (step === 'mapping') setStep('upload');
              else handleClose();
            }}
            className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {step === 'mapping' ? 'Back' : 'Cancel'}
          </button>

          {step === 'mapping' && (
            <button
              onClick={handleParse}
              disabled={importing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--color-accent-green)] text-[var(--color-bg-primary)] font-medium hover:bg-[var(--color-accent-green)]/90 transition-colors disabled:opacity-50"
            >
              {importing ? 'Parsing...' : 'Parse File'}
            </button>
          )}

          {step === 'preview' && (
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--color-accent-green)] text-[var(--color-bg-primary)] font-medium hover:bg-[var(--color-accent-green)]/90 transition-colors shadow-lg shadow-[var(--color-accent-green-glow)]"
            >
              <CheckCircle className="w-4 h-4" />
              {clearExisting ? 'Replace Portfolio' : `Import ${parsedEntries.length} Stocks`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
