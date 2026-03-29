import type { Scenario } from '../types';

const STORAGE_KEY = 'dt-scenarios';

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'base',
    name: 'Base Case',
    horizonYears: 10,
    monthlyContribution: 500,
    dividendGrowthRate: 0.05,
    reinvestRate: 1.0,
    taxRate: 0.15,
    targetMonthlyIncome: 2000,
    version: 1,
  },
  {
    id: 'aggressive',
    name: 'Aggressive DRIP',
    horizonYears: 10,
    monthlyContribution: 1000,
    dividendGrowthRate: 0.08,
    reinvestRate: 1.0,
    taxRate: 0.0,
    targetMonthlyIncome: 2000,
    version: 1,
  },
  {
    id: 'conservative',
    name: 'Conservative',
    horizonYears: 10,
    monthlyContribution: 0,
    dividendGrowthRate: 0.02,
    reinvestRate: 0.5,
    taxRate: 0.2,
    targetMonthlyIncome: 2000,
    version: 1,
  },
];

export function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCENARIOS;
    const parsed = JSON.parse(raw) as Scenario[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SCENARIOS;
    return parsed.map(s => ({
      ...(DEFAULT_SCENARIOS.find(d => d.id === s.id) ?? DEFAULT_SCENARIOS[0]),
      ...s,
    }));
  } catch {
    return DEFAULT_SCENARIOS;
  }
}

export function saveScenarios(scenarios: Scenario[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch (e) {
    console.warn('Failed to save scenarios to localStorage:', e);
  }
}
