// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScenarios, saveScenarios, DEFAULT_SCENARIOS } from './scenarioStorage';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('loadScenarios', () => {
  it('returns DEFAULT_SCENARIOS when localStorage key is absent', () => {
    const result = loadScenarios();
    expect(result).toEqual(DEFAULT_SCENARIOS);
  });

  it('returns DEFAULT_SCENARIOS on invalid JSON', () => {
    localStorage.setItem('dt-scenarios', 'not-valid-json{{{');
    const result = loadScenarios();
    expect(result).toEqual(DEFAULT_SCENARIOS);
  });

  it('merges saved scenarios with ID-matched defaults for schema migration', () => {
    // Save a base scenario missing the targetMonthlyIncome field (simulates v1→v2 migration)
    const partial = [{ id: 'base', name: 'My Base', horizonYears: 5, version: 1 as const }];
    localStorage.setItem('dt-scenarios', JSON.stringify(partial));
    const result = loadScenarios();
    // Should merge from base default first, then overlay saved fields
    expect(result[0].id).toBe('base');
    expect(result[0].name).toBe('My Base');      // saved value wins
    expect(result[0].horizonYears).toBe(5);        // saved value wins
    expect(result[0].targetMonthlyIncome).toBe(2000); // from default
  });
});

describe('saveScenarios', () => {
  it('does not throw when localStorage throws QuotaExceededError', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => saveScenarios(DEFAULT_SCENARIOS)).not.toThrow();
  });

  it('warns to console on QuotaExceededError', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    saveScenarios(DEFAULT_SCENARIOS);
    expect(warnSpy).toHaveBeenCalled();
  });
});
