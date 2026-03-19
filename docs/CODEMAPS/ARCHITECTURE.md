# Architecture Codemap

**Last Updated:** 2026-03-19
**Entry Points:** src/main.tsx, src/App.tsx

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   Browser/      │    │   Vite Dev       │    │   Build Output     │
│   Client        │◄──►│   Server         │◄──►│   (dist/)          │
└─────────────────┘    └──────────────────┘    └────────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   React App     │    │   TypeScript     │    │   Optimized Assets │
│   (SPA)         │    │   Compiler       │    │                    │
└─────────────────┘    └──────────────────┘    └────────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   Components    │    │   Context API    │    │   Utility Functions│
│   (UI Layer)    │    │   (State Mgmt)   │    │   (Helpers)        │
└─────────────────┘    └──────────────────┘    └────────────────────┘
         │                         │                         │
         └─────────────┬───────────┘                         │
                       ▼                                     ▼
               ┌──────────────────┐                  ┌──────────────────┐
               │   Data Flow      │                  │   File Processing│
               │   (Context ↔     │                  │   (CSV/Excel)    │
               │    Components)   │                  │                  │
               └──────────────────┘                  └──────────────────┘
```

## Key Modules

| Module | Purpose | Exports | Dependencies |
|--------|---------|---------|--------------|
| **App.tsx** | Root application component | Default export of App component | React, Components, Context, CSS |
| **main.tsx** | Application entry point | Default export of React app | ReactDOM, App, index.css |
| **PortfolioContext.tsx** | Global state management for portfolio data | PortfolioContext, usePortfolio hook | React, types/PortfolioEntry |
| **components/** | Reusable UI components | Various component exports | React, lucide-icons, utils |
| **utils/** | Utility functions | Calculation helpers, file parsers | date-fns, papaparse, xlsx, uuid |
| **types/** | TypeScript type definitions | PortfolioEntry, DividendFrequency, etc. | None (pure types) |

## Data Flow

1. **User Interaction**: User interacts with components (AddEditModal, ImportModal, PortfolioTable)
2. **State Updates**: Components dispatch state changes via PortfolioContext
3. **Data Persistence**: Portfolio data stored in localStorage via context
4. **Calculations**: Utils perform dividend calculations on portfolio data
5. **File Processing**: ImportModal processes CSV/Excel files using fileParser utilities
6. **UI Updates**: Components re-render based on context state changes

## External Dependencies

- **react** - UI library (^19.2.0)
- **react-dom** - React DOM bindings (^19.2.0)
- **date-fns** - Date manipulation utilities (^4.1.0)
- **lucide-react** - Icon library (^0.577.0)
- **papaparse** - CSV parsing library (^5.5.3)
- **recharts** - Charting library (^3.8.0)
- **uuid** - Unique ID generation (^13.0.0)
- **xlsx** - Excel file parsing (^0.18.5)
- **vite** - Build tool and dev server (^7.3.1)
- **typescript** - Language compiler (~5.9.3)
- **vitest** - Testing framework (^4.1.0)
- **eslint** - Linting utility (^9.39.1)
- **tailwindcss** - Utility-first CSS framework (^4.2.1)

## Related Areas

- [MODULES.md](MODULES.md) - Detailed module breakdown
- [FILES.md](FILES.md) - Complete file structure reference