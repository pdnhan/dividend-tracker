import { useState, useCallback, useEffect, useRef } from 'react';
import type { Scenario } from '../types';
import { loadScenarios, saveScenarios, DEFAULT_SCENARIOS } from '../utils/scenarioStorage';

const DEBOUNCE_MS = 300;

export interface UseScenariosReturn {
  scenarios: Scenario[];
  activeId: string;
  activeScenario: Scenario;
  setActiveId: (id: string) => void;
  addScenario: (scenario: Scenario) => void;
  deleteScenario: (id: string) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
}

export function useScenarios(): UseScenariosReturn {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => loadScenarios());
  const [activeId, setActiveIdState] = useState<string>(() => {
    const loaded = loadScenarios();
    return loaded[0]?.id ?? DEFAULT_SCENARIOS[0].id;
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced persist whenever scenarios change
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveScenarios(scenarios);
    }, DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [scenarios]);

  const activeScenario =
    scenarios.find(s => s.id === activeId) ?? scenarios[0] ?? DEFAULT_SCENARIOS[0];

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
  }, []);

  const addScenario = useCallback((scenario: Scenario) => {
    setScenarios(prev => [...prev, scenario]);
    setActiveIdState(scenario.id);
  }, []);

  const deleteScenario = useCallback((id: string) => {
    setScenarios(prev => {
      const next = prev.filter(s => s.id !== id);
      return next.length > 0 ? next : DEFAULT_SCENARIOS;
    });
    setActiveIdState(prev => {
      if (prev === id) {
        return scenarios.find(s => s.id !== id)?.id ?? DEFAULT_SCENARIOS[0].id;
      }
      return prev;
    });
  }, [scenarios]);

  const updateScenario = useCallback((id: string, updates: Partial<Scenario>) => {
    setScenarios(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  return {
    scenarios,
    activeId,
    activeScenario,
    setActiveId,
    addScenario,
    deleteScenario,
    updateScenario,
  };
}
