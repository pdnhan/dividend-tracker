# Module Codemap

**Last Updated:** 2026-03-19

## Architecture Overview

This dividend tracker application follows a modular structure with clear separation of concerns:
- **UI Layer**: React components in `src/components/`
- **State Management**: React Context API in `src/context/`
- **Business Logic**: Utility functions in `src/utils/`
- **Type Definitions**: Shared types in `src/types/`
- **Application Entry**: `src/App.tsx` and `src/main.tsx`

## Module Details

### App Module (`src/App.tsx`)

**Purpose**: Root application component that sets up the provider and renders the main UI

**Location**: `src/App.tsx`

**Key Files**:
- `App.tsx` - Main application component

**Dependencies**:
- React
- PortfolioContext (for state management)
- Components: Header, Dashboard, AddEditModal, ImportModal
- CSS: index.css (global styles)

**Exports**:
- `default` - App component function

**Usage Example**:
```typescript
// In main.tsx
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Main Module (`src/main.tsx`)

**Purpose**: Application entry point that bootstraps the React application

**Location**: `src/main.tsx`

**Key Files**:
- `main.tsx` - Entry point file

**Dependencies**:
- ReactDOM
- App component
- index.css (global styles)

**Exports**:
- None (entry point only)

**Usage Example**:
```typescript
// This is the entry point, not imported elsewhere
```

### Portfolio Context Module (`src/context/PortfolioContext.tsx`)

**Purpose**: Manages global state for portfolio data using React Context API

**Location**: `src/context/PortfolioContext.tsx`

**Key Files**:
- `PortfolioContext.tsx` - Context provider and custom hook

**Dependencies**:
- React (useState, useEffect, useContext, createContext)
- types/PortfolioEntry (for type definitions)
- utils/calculations (for dividend calculations)

**Exports**:
- `PortfolioContext` - React context object
- `usePortfolio()` - Custom hook to access portfolio state and actions
- `PortfolioProvider` - Component that wraps application with context

**Usage Example**:
```typescript
import { usePortfolio } from '@/context/PortfolioContext';

function SomeComponent() {
  const { entries, addEntry, removeEntry } = usePortfolio();
  // Use portfolio state and actions
}
```

### Components Module (`src/components/`)

**Purpose**: Contains all reusable UI components for the application

**Location**: `src/components/`

**Key Files**:
- `Header.tsx` - Application header with title and navigation
- `Dashboard.tsx` - Main dashboard showing portfolio summary and charts
- `PortfolioTable.tsx` - Table displaying portfolio entries with edit/delete actions
- `AddEditModal.tsx` - Modal for adding or editing portfolio entries
- `ImportModal.tsx` - Modal for importing portfolio data from CSV/Excel files

**Dependencies**:
- React
- lucide-react (for icons)
- PortfolioContext (for state access)
- Various utility functions (date formatting, calculations)
- Tailwind CSS (for styling)

**Exports**:
- Each component exports a default function component

**Usage Example**:
```typescript
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
// etc.
```

### Utils Module (`src/utils/`)

**Purpose**: Contains utility functions for calculations, file parsing, and helpers

**Location**: `src/utils/`

**Key Files**:
- `calculations.ts` - Financial calculations for dividends, yields, etc.
- `fileParser.ts` - Functions to parse CSV and Excel files
- `calculations.test.ts` - Unit tests for calculation functions
- `fileParser.test.ts` - Unit tests for file parsing functions

**Dependencies**:
- date-fns (for date manipulation)
- papaparse (for CSV parsing)
- xlsx (for Excel parsing)
- uuid (for generating unique IDs)

**Exports**:
- From calculations.ts:
  - `calculateAnnualDividend(entry)` - Calculates annual dividend for an entry
  - `calculateYieldOnCost(entry)` - Calculates yield on cost
  - `calculatePortfolioValue(entries)` - Calculates total portfolio value
  - `calculateAnnualDividendIncome(entries)` - Calculates total annual dividend income
  - `calculateWeightedAverageYield(entries)` - Calculates weighted average yield
  - `safeCalculate(fn)` - Wrapper to handle NaN/Infinity values
- From fileParser.ts:
  - `parseCSV(file)` - Parses CSV file and returns portfolio entries
  - `parseExcel(file)` - Parses Excel file and returns portfolio entries

**Usage Example**:
```typescript
import { calculateAnnualDividend, calculatePortfolioValue } from '@/utils/calculations';
import { parseCSV } from '@/utils/fileParser';

const annualDividend = calculateAnnualDividend(entry);
const totalValue = calculatePortfolioValue(entries);
const entriesFromCSV = await parseCSV(file);
```

### Types Module (`src/types/`)

**Purpose**: Contains shared TypeScript type definitions used throughout the application

**Location**: `src/types/`

**Key Files**:
- `index.ts` - Main export file for all types

**Dependencies**:
- None (pure type definitions)

**Exports**:
- `PortfolioEntry` - Interface representing a single stock/ETF holding
- `DividendFrequency` - Union type for dividend payment frequencies
- `CurrencyConfig` - Type for currency configuration objects
- `SummaryStats` - Type for portfolio summary statistics

**Usage Example**:
```typescript
import type { PortfolioEntry, DividendFrequency } from '@/types';

const entry: PortfolioEntry = {
  id: '1',
  ticker: 'AAPL',
  companyName: 'Apple Inc.',
  shares: 10,
  averageCostBasis: 150.0,
  annualDividendPerShare: 0.92,
  dividendFrequency: 'quarterly',
  exDividendDate: '2024-02-09'
};

const frequency: DividendFrequency = 'monthly';
```

## Dependency Graph

```
src/main.tsx
    ↓
src/App.tsx
    ↓
┌─────────────────────────────┐
│ src/context/PortfolioContext│
│        ▲        ▲            │
│        │        │            │
│ src/types/         src/utils/ │
│        │        │            │
│        ▼        ▼            │
└─────────────────────────────┘
    ↓
src/components/
    ↓
(User Interface)
```

## Public API Summary

### Context API
- `usePortfolio()` - Returns `{ entries, addEntry, updateEntry, removeEntry, ... }`

### Utility Functions
- `calculateAnnualDividend(entry: PortfolioEntry): number`
- `calculateYieldOnCost(entry: PortfolioEntry): number`
- `calculatePortfolioValue(entries: PortfolioEntry[]): number`
- `calculateAnnualDividendIncome(entries: PortfolioEntry[]): number`
- `calculateWeightedAverageYield(entries: PortfolioEntry[]): number`
- `parseCSV(file: File): Promise<PortfolioEntry[]>`
- `parseExcel(file: File): Promise<PortfolioEntry[]>`

### Components
- `Header()` - Renders application header
- `Dashboard()` - Renders main dashboard with summary and charts
- `PortfolioTable({ entries, onEdit, onDelete })` - Renders editable portfolio table
- `AddEditModal({ isOpen, onClose, onSave, entry })` - Modal for adding/editing entries
- `ImportModal({ isOpen, onClose, onImport })` - Modal for importing data

## Data Flow Through Modules

1. **File Import**: ImportModal → fileParser utils → PortfolioContext (via usePortfolio)
2. **Data Entry**: AddEditModal → PortfolioContext (via usePortfolio)
3. **Data Display**: PortfolioTable → PortfolioContext (via usePortfolio)
4. **Calculations**: Dashboard → utils/calculations → PortfolioContext (via usePortfolio)
5. **Persistence**: PortfolioContext → localStorage (automatic save/load)

## Cross-Module Relationships

- **Context ↔ Components**: All components use `usePortfolio()` hook to access/modify state
- **Context ↔ Utils**: Context provides data to utils for calculations; utils return calculated values
- **Utils ↔ Types**: Utils import and use PortfolioEntry type for function parameters/returns
- **Components ↔ Types**: Components import PortfolioEntry type for props and state
- **Components ↔ Utils**: Components import utility functions for formatting and calculations