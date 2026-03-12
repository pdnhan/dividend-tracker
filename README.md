# Dividend Tracker

A React 19 + TypeScript web application for tracking dividend investments and projecting future dividend income.

## Features

- **Portfolio Management**: Add, edit, and delete stock holdings
- **Dividend Projections**: Monthly and yearly dividend estimates
- **Import Support**: Import data from CSV or Excel files
- **Multi-Currency**: Support for USD, EUR, and VND currencies
- **Yield Calculations**: Calculate expected dividend yield and cost basis

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- Recharts for data visualization
- PapaParse for CSV parsing
- XLSX for Excel parsing

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/     # React components
├── context/        # React Context providers
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Root component
└── main.tsx        # Entry point
```

## Adding Tests

To add tests, install Vitest:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Then run tests with:

```bash
npx vitest run
```
