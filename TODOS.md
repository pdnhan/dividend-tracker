# TODOS

Deferred work tracked here. Items are sourced from plan reviews and office hours.

---

## P1 — GitHub Pages Deploy

**What:** Add `.github/workflows/deploy.yml` (GitHub Actions) and set `base: '/dividend-tracker/'` in `vite.config.ts`.

**Why:** Without these, the app deploys to a blank page on GitHub Pages. The base path tells Vite where the app is served from; the workflow automates the build+publish on every merge to master.

**Pros:** Anyone can share the URL after the next merge. Required for r/dividends distribution.

**Cons:** None. Completely additive.

**Context:** Phase 1 carryover. The `peaceiris/actions-gh-pages@v3` action is the standard approach. The workflow is ~20 lines. The vite config change is one line. Deferred to avoid coupling with the engine PR.

**Effort:** S (human: ~30min / CC: ~10min)

**Depends on:** None. Can be done independently of the projection engine.

---

## P2 — Scenario Schema Versioning

**What:** Add `version: 1` to the `Scenario` interface. On `localStorage.getItem("dt-scenarios")` load, merge any missing fields from `DEFAULT_SCENARIOS` defaults (per-field, not full replacement).

**Why:** Phase 2B will add new fields to `Scenario` (e.g., `inflationRate`). Any saved scenario from Phase 2A won't have those fields. The parse succeeds but missing fields are `undefined`, causing silent NaN in the engine. Schema versioning prevents this.

**Pros:** Forwards-compatible. Saved user scenarios survive Phase 2B additions without data loss.

**Cons:** Small added complexity in the load function.

**Context:** Flagged during CEO plan review (Codex outside voice). Low urgency in Phase 2A (3 stable fields). Load-bearing before Phase 2B adds fields. Pattern: `const loaded = JSON.parse(raw); return loaded.map(s => ({ ...DEFAULT_SCENARIOS[0], ...s }))` — merge with defaults so any missing field gets its default value.

**Effort:** S (human: ~30min / CC: ~15min)

**Depends on:** Phase 2B field additions. Address before or at the start of Phase 2B.

---

## P3 — Component Tests for ProjectionSimulator

**What:** Install `@testing-library/react` + `@testing-library/user-event` and write component-level tests for `ProjectionSimulator.tsx`: KPI strip renders correct values, sliders update KPIs, ScenarioTabs switches active scenario, empty portfolio shows placeholder.

**Why:** Engine tests verify math. Component tests verify the UI wiring is correct — that `useMemo` recomputes when portfolio changes, that `onScenarioChange` updates the right state, that the KPI values actually appear in the DOM.

**Pros:** Catches wiring bugs that unit tests miss. Standard test pyramid investment.

**Cons:** Requires `@testing-library/react` install + jsdom setup in Vitest config (change `environment: 'node'` to `environment: 'jsdom'` globally or use per-file pragma).

**Context:** Currently no component test infra. Engine + storage tests are sufficient to ship Phase 2A. This is the natural next test investment once the component is stable.

**Effort:** S (human: ~2h / CC: ~20min)

**Depends on:** Phase 2A component complete.
