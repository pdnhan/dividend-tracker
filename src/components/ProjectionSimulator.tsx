import React, { useMemo, useState } from 'react';
import { usePortfolio, useCurrency } from '../context/PortfolioContext';
import { useScenarios } from '../hooks/useScenarios';
import { runProjection, calculateIncomeToday } from '../utils/projectionEngine';
import type { Scenario, ProjectionPoint } from '../types';

// ─── KPI Strip ───────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  muted?: boolean;
}

function KpiCard({ label, value, muted }: KpiCardProps) {
  return (
    <div className="kpi-card" style={{ opacity: muted ? 0.45 : 1 }}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

// ─── Scenario Tabs ───────────────────────────────────────────────────────────

interface ScenarioTabsProps {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

function ScenarioTabs({ scenarios, activeId, onSelect, onAdd, onDelete, onRename }: ScenarioTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (s: Scenario) => {
    setEditingId(s.id);
    setEditValue(s.name);
  };

  const commitEdit = (id: string) => {
    if (editValue.trim()) onRename(id, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="scenario-tabs" role="tablist" aria-label="Projection scenarios">
      {scenarios.map(s => (
        <div
          key={s.id}
          role="tab"
          aria-selected={s.id === activeId}
          className={`scenario-tab${s.id === activeId ? ' active' : ''}`}
          onClick={() => onSelect(s.id)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s.id); } }}
          tabIndex={s.id === activeId ? 0 : -1}
        >
          {editingId === s.id ? (
            <input
              className="tab-rename-input"
              value={editValue}
              autoFocus
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => commitEdit(s.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit(s.id);
                if (e.key === 'Escape') setEditingId(null);
                e.stopPropagation();
              }}
              onClick={e => e.stopPropagation()}
              aria-label="Rename scenario"
            />
          ) : (
            <span
              className="tab-name"
              onDoubleClick={e => { e.stopPropagation(); startEdit(s); }}
              title="Double-click to rename"
            >
              {s.name}
            </span>
          )}
          {scenarios.length > 1 && (
            <button
              className="tab-delete"
              aria-label={`Delete ${s.name} scenario`}
              onClick={e => { e.stopPropagation(); onDelete(s.id); }}
              tabIndex={-1}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        className="scenario-tab tab-add"
        aria-label="Add new scenario"
        onClick={onAdd}
        title="Add scenario"
      >
        +
      </button>
    </div>
  );
}

// ─── Assumption Panel ────────────────────────────────────────────────────────

interface SliderRowProps {
  label: string;
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

function SliderRow({ label, id, value, min, max, step, display, onChange }: SliderRowProps) {
  return (
    <div className="slider-row">
      <label htmlFor={id} className="slider-label">{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="slider-input"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
      />
      <span className="slider-value" aria-hidden="true">{display}</span>
    </div>
  );
}

interface AssumptionPanelProps {
  scenario: Scenario;
  onChange: (updates: Partial<Scenario>) => void;
  formatCurrency: (v: number) => string;
}

function AssumptionPanel({ scenario, onChange, formatCurrency }: AssumptionPanelProps) {
  return (
    <section className="assumption-panel" aria-label="Scenario assumptions">
      <h3 className="panel-title">Assumptions</h3>
      <SliderRow
        label="Horizon"
        id="horizon-years"
        value={scenario.horizonYears}
        min={1} max={30} step={1}
        display={`${scenario.horizonYears} yr`}
        onChange={v => onChange({ horizonYears: v })}
      />
      <SliderRow
        label="Monthly contribution"
        id="monthly-contribution"
        value={scenario.monthlyContribution}
        min={0} max={10000} step={100}
        display={formatCurrency(scenario.monthlyContribution)}
        onChange={v => onChange({ monthlyContribution: v })}
      />
      <SliderRow
        label="Dividend growth"
        id="dividend-growth-rate"
        value={Math.round(scenario.dividendGrowthRate * 1000) / 10}
        min={0} max={20} step={0.5}
        display={`${(scenario.dividendGrowthRate * 100).toFixed(1)}%`}
        onChange={v => onChange({ dividendGrowthRate: v / 100 })}
      />
      <SliderRow
        label="Reinvest rate"
        id="reinvest-rate"
        value={Math.round(scenario.reinvestRate * 100)}
        min={0} max={100} step={5}
        display={`${Math.round(scenario.reinvestRate * 100)}%`}
        onChange={v => onChange({ reinvestRate: v / 100 })}
      />
      <SliderRow
        label="Tax drag"
        id="tax-rate"
        value={Math.round(scenario.taxRate * 100)}
        min={0} max={50} step={1}
        display={`${Math.round(scenario.taxRate * 100)}%`}
        onChange={v => onChange({ taxRate: v / 100 })}
      />
      <SliderRow
        label="Income target"
        id="target-monthly-income"
        value={scenario.targetMonthlyIncome}
        min={0} max={20000} step={100}
        display={formatCurrency(scenario.targetMonthlyIncome)}
        onChange={v => onChange({ targetMonthlyIncome: v })}
      />
      <p className="panel-note">
        Reinvestment price uses your cost basis as a proxy. Actual DRIP results will vary with market price.
      </p>
      <p className="panel-note">
        Monthly contribution is allocated proportionally by each holding's portfolio weight.
      </p>
    </section>
  );
}

// ─── Projection Chart ────────────────────────────────────────────────────────

interface ProjectionChartProps {
  points: ProjectionPoint[];
  targetMonthlyIncome: number;
  formatCurrency: (v: number) => string;
}

function ProjectionChart({ points, targetMonthlyIncome, formatCurrency }: ProjectionChartProps) {
  if (points.length === 0) return null;

  const annualPoints = points.filter(p => p.month % 12 === 0);
  const maxIncome = Math.max(...annualPoints.map(p => p.rollingAnnualIncome), 1);
  const targetAnnual = targetMonthlyIncome * 12;

  return (
    <div className="projection-chart" aria-label="Annual income projection chart">
      <h3 className="panel-title">Annual Income Projection</h3>
      <div className="chart-bars">
        {annualPoints.map(p => {
          const heightPct = (p.rollingAnnualIncome / Math.max(maxIncome, targetAnnual, 1)) * 100;
          const isGoalMet = targetMonthlyIncome > 0 && p.rollingAnnualIncome >= targetAnnual;
          return (
            <div key={p.month} className="chart-bar-col">
              <div
                className={`chart-bar${isGoalMet ? ' goal-met' : ''}`}
                style={{ height: `${Math.max(heightPct, 2)}%` }}
                title={`Year ${p.calendarYear}: ${formatCurrency(p.rollingAnnualIncome)}/yr`}
                role="img"
                aria-label={`Year ${p.calendarYear}: ${formatCurrency(p.rollingAnnualIncome)} annual income`}
              />
              <span className="chart-bar-label">{p.calendarYear}</span>
            </div>
          );
        })}
      </div>
      {targetMonthlyIncome > 0 && (
        <div
          className="goal-line"
          style={{ bottom: `${Math.min((targetAnnual / Math.max(maxIncome, targetAnnual, 1)) * 100, 100)}%` }}
          aria-label={`Target income: ${formatCurrency(targetMonthlyIncome)}/month`}
        />
      )}
      <p className="chart-note">Projections update when you edit your portfolio.</p>
    </div>
  );
}

// ─── Income Calendar ─────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface IncomeCalendarProps {
  points: ProjectionPoint[];
  formatCurrency: (v: number) => string;
}

function IncomeCalendar({ points, formatCurrency }: IncomeCalendarProps) {
  const availableYears = [...new Set(points.map(p => p.calendarYear))].sort();
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] ?? new Date().getFullYear());

  if (points.length === 0) return null;

  const yearPoints = points.filter(p => p.calendarYear === selectedYear);
  const maxMonthly = Math.max(...yearPoints.map(p => p.monthlyIncome), 0.01);

  return (
    <div className="income-calendar" aria-label="Monthly income calendar">
      <div className="calendar-header">
        <h3 className="panel-title">Income Calendar</h3>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          aria-label="Select projection year"
          className="year-select"
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="calendar-grid">
        {MONTH_NAMES.map((name, idx) => {
          const point = yearPoints.find(p => p.calendarMonth === idx);
          const income = point?.monthlyIncome ?? 0;
          const intensity = income > 0 ? Math.max(0.1, income / maxMonthly) : 0;
          return (
            <div
              key={idx}
              className="calendar-cell"
              style={{ '--intensity': intensity } as React.CSSProperties}
              title={income > 0 ? `${name}: ${formatCurrency(income)}` : `${name}: no payout`}
              aria-label={`${name} ${selectedYear}: ${income > 0 ? formatCurrency(income) : 'no payout'}`}
            >
              <span className="cell-month">{name}</span>
              {income > 0 && <span className="cell-amount">{formatCurrency(income)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectionSimulator() {
  const { entries } = usePortfolio();
  const { formatCurrency } = useCurrency();
  const { scenarios, activeId, activeScenario, setActiveId, addScenario, deleteScenario, updateScenario } = useScenarios();

  const points = useMemo(
    () => runProjection(entries, activeScenario),
    [entries, activeScenario]
  );

  const incomeToday = useMemo(
    () => calculateIncomeToday(entries, activeScenario),
    [entries, activeScenario]
  );

  const incomeAtHorizon = points.length > 0
    ? points[points.length - 1].rollingAnnualIncome / 12
    : 0;

  // Target date: first month where rolling income/12 >= targetMonthlyIncome
  // Only look after rolling window is full (month >= 12) to avoid ramp-up false positives
  const targetDate = useMemo(() => {
    if (activeScenario.targetMonthlyIncome <= 0) return null;
    const hit = points.find(
      p => p.month >= 12 && p.rollingAnnualIncome / 12 >= activeScenario.targetMonthlyIncome
    );
    if (!hit) return null;
    return new Date(hit.calendarYear, hit.calendarMonth, 1)
      .toLocaleString('default', { month: 'short', year: 'numeric' });
  }, [points, activeScenario.targetMonthlyIncome]);

  const coverageNow = activeScenario.targetMonthlyIncome > 0
    ? incomeToday / activeScenario.targetMonthlyIncome
    : null;

  const handleAddScenario = () => {
    const newId = `custom-${Date.now()}`;
    addScenario({
      ...activeScenario,
      id: newId,
      name: `Scenario ${scenarios.length + 1}`,
      version: 1,
    });
  };

  const handleRename = (id: string, name: string) => {
    updateScenario(id, { name });
  };

  const isEmpty = entries.length === 0;

  return (
    <div className="projection-simulator">
      <ScenarioTabs
        scenarios={scenarios}
        activeId={activeId}
        onSelect={setActiveId}
        onAdd={handleAddScenario}
        onDelete={deleteScenario}
        onRename={handleRename}
      />

      {isEmpty ? (
        <div className="empty-state" role="status">
          <p>Add holdings to see your projection.</p>
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="kpi-strip" role="region" aria-label="Key projection metrics">
            <KpiCard
              label="Monthly income today"
              value={formatCurrency(incomeToday)}
            />
            <KpiCard
              label={`Monthly income in ${activeScenario.horizonYears} yr`}
              value={formatCurrency(incomeAtHorizon)}
            />
            <KpiCard
              label="Target income date"
              value={targetDate ?? '—'}
              muted={!targetDate}
            />
            <KpiCard
              label="Coverage today"
              value={coverageNow !== null ? `${(coverageNow * 100).toFixed(0)}%` : '—'}
              muted={coverageNow === null}
            />
          </div>

          {/* Main layout: assumptions left, chart + calendar right */}
          <div className="simulator-layout">
            <AssumptionPanel
              scenario={activeScenario}
              onChange={updates => updateScenario(activeId, updates)}
              formatCurrency={formatCurrency}
            />
            <div className="simulator-right">
              <ProjectionChart
                points={points}
                targetMonthlyIncome={activeScenario.targetMonthlyIncome}
                formatCurrency={formatCurrency}
              />
              <IncomeCalendar
                points={points}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
