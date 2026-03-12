# AGENTS.md - Developer Guide for Dividend Tracker

This document provides guidelines and instructions for agents working on this codebase.

## Project Overview

- **Type**: React 19 + TypeScript web application
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API
- **Testing**: No test framework currently configured
- **Lint**: ESLint 9 with TypeScript support

## Commands

### Development
```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build
npm run lint         # Run ESLint on all files
```

### Running a Single Test
No test framework is currently configured. To add tests, install Vitest:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Then run tests with:
```bash
npx vitest run
npx vitest run src/utils/calculations.test.ts  # Run specific file
```

### Linting
```bash
npm run lint                    # Lint all files
npx eslint src/utils/calculations.ts  # Lint specific file
```

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled (`strict: true`)
- No unused locals or parameters allowed
- Use `import type` for type-only imports
- Use `erasableSyntaxOnly` - no `.type` or `.interface` file extensions needed

### Imports Organization
```typescript
// 1. External libraries
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

// 2. Internal types (use 'type' keyword)
import type { PortfolioEntry, DividendFrequency } from '../types';

// 3. Internal modules
import { calculateAnnualDividend } from './calculations';
import { usePortfolio } from '../context/PortfolioContext';
```

### Naming Conventions
- **Components**: PascalCase (e.g., `PortfolioTable`, `AddEditModal`)
- **Functions/variables**: camelCase (e.g., `calculateAnnualDividend`, `entries`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `STORAGE_KEY`, `CURRENCY_CONFIG`)
- **Types/Interfaces**: PascalCase (e.g., `PortfolioEntry`, `CurrencyContextType`)
- **File names**: camelCase for utils/components (e.g., `fileParser.ts`, `calculations.ts`), PascalCase for components (e.g., `Dashboard.tsx`)

### React Patterns

#### Context Usage
Create context with undefined initial type, and use custom hooks with error boundaries:
```typescript
const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within a PortfolioProvider');
  return context;
}
```

#### Component Structure
Use function components with explicit props typing:
```typescript
interface Props { isOpen: boolean; onClose: () => void; }

export default function Modal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;
  return <div>...</div>;
}
```

#### State Management
Use functional updates for state:
```typescript
const [entries, setEntries] = useState<PortfolioEntry[]>([]);

const addEntry = (entry: Omit<PortfolioEntry, 'id'>) => {
  const newEntry: PortfolioEntry = { ...entry, id: crypto.randomUUID() };
  setEntries(prev => [...prev, newEntry]);
};
```

### Error Handling
```typescript
// Use try/catch with graceful fallbacks
try {
  const data = JSON.parse(stored);
  return data;
} catch {
  return generateSampleData();
}

// Safe calculation helper
function safeCalculate(calculateFn: () => number): number {
  const result = calculateFn();
  return isNaN(result) || !isFinite(result) ? 0 : result;
}
```

### Utility Functions
```typescript
// Export individual functions (not default)
export function calculateAnnualDividend(entry: PortfolioEntry): number {
  return entry.shares * entry.annualDividendPerShare;
}
```

### CSS/Tailwind
- Use Tailwind CSS utility classes
- Use CSS custom properties for theming (e.g., `var(--color-text-primary)`)
- Use Tailwind's `@apply` directive in CSS for reusable patterns

### Type Definitions
```typescript
// Use type for unions and primitives
export type DividendFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

// Use interface for object shapes
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
```

### Preferred Libraries
- **Date handling**: `date-fns`
- **Icons**: `lucide-react`
- **Charts**: `recharts`
- **CSV parsing**: `papaparse`
- **Excel parsing**: `xlsx`
- **IDs**: Use built-in `crypto.randomUUID()`

## File Structure
```
src/
├── components/    # React components
├── context/       # React Context providers
├── types/        # TypeScript type definitions
├── utils/        # Utility functions
├── App.tsx       # Root component
└── main.tsx      # Entry point
```

## Common Tasks
- **New Component**: Create in `src/components/`, define Props interface, export as named function
- **New Utility**: Add to `src/utils/`, use TypeScript types, handle edge cases
- **New Type**: Add to `src/types/index.ts`, use `type` for unions, `interface` for objects
