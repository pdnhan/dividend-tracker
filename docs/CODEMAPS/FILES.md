# File Structure Codemap

**Last Updated:** 2026-03-19

## Directory Structure Overview

```
dividend-tracker/
├── .git/                     # Git version control
├── .gitignore                # Git ignore rules
├── AGENTS.md                 # Agent development guidelines
├── coverage/                 # Test coverage reports
├── dist/                     # Production build output
├── eslint.config.js          # ESLint configuration
├── index.html                # HTML entry point
├── node_modules/             # Dependencies
├── package-lock.json         # Locked dependency versions
├── package.json              # Project metadata and dependencies
├── public/                   # Static assets
├── README.md                 # Project documentation
├── src/                      # Source code
│   ├── App.tsx               # Root application component
│   ├── assets/               # Static assets (images, icons)
│   │   └── react.svg         # React logo
│   ├── components/           # React components
│   │   ├── AddEditModal.tsx  # Modal for adding/editing portfolio entries
│   │   ├── Dashboard.tsx     # Main dashboard with summary and charts
│   │   ├── Header.tsx        # Application header
│   │   ├── ImportModal.tsx   # Modal for importing CSV/Excel data
│   │   └── PortfolioTable.tsx# Table displaying portfolio entries
│   ├── context/              # React Context providers
│   │   └── PortfolioContext.tsx # Portfolio state management
│   ├── index.css             # Global CSS styles
│   ├── main.tsx              # Application entry point
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # Shared type exports
│   └── utils/                # Utility functions
│       ├── calculations.ts   # Financial calculation functions
│       ├── calculations.test.ts # Tests for calculations
│       ├── fileParser.ts     # CSV/Excel file parsing functions
│       └── fileParser.test.ts # Tests for file parsing
├── tsconfig.app.json         # TypeScript config for app
├── tsconfig.json             # Base TypeScript config
├── tsconfig.node.json        # TypeScript config for Node.js
└── vite.config.ts            # Vite build configuration
```

## File Purposes

### Root Configuration Files
- **package.json** - Project metadata, dependencies, and npm scripts
- **package-lock.json** - Exact versions of installed dependencies
- **tsconfig.json** - Base TypeScript compiler configuration
- **tsconfig.app.json** - TypeScript config specific to the application
- **tsconfig.node.json** - TypeScript config for Node.js environment
- **vite.config.ts** - Vite build tool configuration
- **eslint.config.js** - ESLint configuration for code quality
- **.gitignore** - Files and directories to exclude from Git
- **README.md** - Project overview and setup instructions
- **AGENTS.md** - Guidelines for AI agents working on this codebase
- **index.html** - HTML template for the application

### Source Code (`src/`)

#### Application Entry Points
- **main.tsx** - Entry point that renders the App component into the DOM
- **App.tsx** - Root component that sets up providers and renders the UI

#### Components (`src/components/`)
- **Header.tsx** - Displays application title and navigation elements
- **Dashboard.tsx** - Shows portfolio summary statistics and visual charts
- **PortfolioTable.tsx** - Interactive table for viewing and managing portfolio entries
- **AddEditModal.tsx** - Form modal for creating new or editing existing portfolio entries
- **ImportModal.tsx** - Modal for uploading and parsing CSV/Excel portfolio files

#### State Management (`src/context/`)
- **PortfolioContext.tsx** - Implements React Context for global portfolio state management
  - Provides state: portfolio entries, loading states, etc.
  - Provides actions: add, update, remove entries, import data, etc.
  - Includes usePortfolio() custom hook for accessing context

#### Types (`src/types/`)
- **index.ts** - Centralized export of all TypeScript interfaces and types
  - PortfolioEntry: Interface for individual stock/ETF holdings
  - DividendFrequency: Union type for payment frequencies (monthly, quarterly, etc.)
  - CurrencyConfig: Type for currency formatting configuration
  - SummaryStats: Type for portfolio summary statistics object

#### Utilities (`src/utils/`)
- **calculations.ts** - Pure functions for financial calculations:
  - calculateAnnualDividend: Computes yearly dividend from shares and per-share amount
  - calculateYieldOnCost: Calculates yield based on original investment
  - calculatePortfolioValue: Sums market value of all holdings
  - calculateAnnualDividendIncome: Totals expected yearly dividend income
  - calculateWeightedAverageYield: Computes average yield weighted by position size
  - safeCalculate: Wrapper to handle invalid numeric results (NaN/Infinity)
- **fileParser.ts** - Functions for importing portfolio data:
  - parseCSV: Reads and parses CSV files into PortfolioEntry arrays
  - parseExcel: Reads and parses Excel files (.xlsx) into PortfolioEntry arrays
- **calculations.test.ts** - Unit tests for calculation functions
- **fileParser.test.ts** - Unit tests for file parsing functions

#### Assets (`src/assets/`)
- **react.svg** - React logo used in the application

#### Styles (`src/`)
- **index.css** - Global CSS styles and Tailwind CSS directives

### Build and Test Output
- **dist/** - Production-ready build files generated by `npm run build`
- **coverage/** - Test coverage reports generated by `npm run test:coverage`
- **node_modules/** - Installed npm dependencies

## Key File Relationships

### Entry Point Flow
```
index.html
    ↓
main.tsx  ←── index.css (styles)
    ↓
App.tsx   ←── components/ (UI)
    ↓
context/PortfolioContext.tsx  ←── types/ (types)
    ↓
utils/ (calculations, fileParser)
    ↓
components/ (specific components)
```

### Data Flow Through Files
1. **Import Process**:
   - ImportModal.tsx → fileParser.ts → PortfolioContext.tsx → localStorage

2. **Data Entry Process**:
   - AddEditModal.tsx → PortfolioContext.tsx → localStorage

3. **Display Process**:
   - PortfolioTable.tsx ← PortfolioContext.tsx
   - Dashboard.tsx ← PortfolioContext.tsx ← calculations.ts

4. **Calculation Process**:
   - Dashboard.tsx → calculations.ts ← PortfolioContext.tsx

### Import/Export Patterns

#### Default Exports
- App.tsx, main.tsx, all component files, context file
- Example: `export default function App() { ... }`

#### Named Exports
- Utility functions, type definitions, context objects
- Example: `export function calculateAnnualDividend(entry) { ... }`
- Example: `export interface PortfolioEntry { ... }`
- Example: `export const PortfolioContext = createContext(...)`

#### Import Patterns
- External libraries: `import { useState } from 'react'`
- Internal types: `import type { PortfolioEntry } from '@/types'`
- Internal modules: `import { calculateAnnualDividend } from '@/utils/calculations'`
- Components: `import Header from '@/components/Header'`

## File Naming Conventions

- **Components**: PascalCase with .tsx extension (e.g., `PortfolioTable.tsx`)
- **Utilities**: camelCase with .ts extension (e.g., `fileParser.ts`)
- **Context**: PascalCase with .tsx extension (e.g., `PortfolioContext.tsx`)
- **Types**: camelCase with .ts extension (e.g., `index.ts`)
- **Styles**: lowercase with .css extension (e.g., `index.css`)
- **Config files**: lowercase with appropriate extensions (e.g., `vite.config.ts`)
- **Test files**: same name as source with .test.ts suffix (e.g., `calculations.test.ts`)

## Platform-Specific Files

- **public/** - Static assets served at root URL (favicon, etc.)
- **assets/** - Imported assets processed by Vite (images, SVGs)
- **node_modules/** - Third-party dependencies (not committed to repo)
- **dist/** - Production build output (not committed to repo)
- **coverage/** - Test coverage reports (not committed to repo)

## Recent Changes Indicator

Files modified in the current development cycle would typically include:
- Component files when adding/modifying UI features
- Context file when changing state management logic
- Utility files when adding/modifying calculation or parsing functions
- Type files when modifying data structures
- Configuration files when changing build or development setup

This file structure follows standard React/Vite/TypeScript conventions with clear separation of concerns between UI, state management, business logic, and type definitions.