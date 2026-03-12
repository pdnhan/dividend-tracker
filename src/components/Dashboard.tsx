import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { usePortfolio, useCurrency } from '../context/PortfolioContext';
import { 
  calculatePortfolioSummary, 
  calculateMonthlyDividends,
  formatPercent,
  calculateAnnualDividend
} from '../utils/calculations';

const COLORS = ['#00d68f', '#00cfe8', '#ffaa00', '#ff6b6b', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) => {
  const { formatCurrency } = useCurrency();
  
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { entries } = usePortfolio();
  const { formatCurrency, currencySymbol } = useCurrency();
  const summary = calculatePortfolioSummary(entries);
  const monthlyData = calculateMonthlyDividends(entries);

  const pieData = entries.slice(0, 8).map(entry => ({
    name: entry.ticker,
    value: calculateAnnualDividend(entry)
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-5 animate-fade-in stagger-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Annual Dividends
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-green-dim)] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[var(--color-accent-green)]" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[var(--color-accent-green)] counter">
            {formatCurrency(summary.totalAnnualDividends)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {formatPercent(summary.dividendYield)} yield
          </p>
        </div>

        <div className="glass rounded-xl p-5 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Monthly Average
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-cyan)]/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[var(--color-accent-cyan)]" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[var(--color-accent-cyan)] counter">
            {formatCurrency(summary.monthlyAverage)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Per month projected
          </p>
        </div>

        <div className="glass rounded-xl p-5 animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Total Holdings
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-amber)]/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[var(--color-accent-amber)]" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[var(--color-accent-amber)] counter">
            {formatCurrency(summary.totalCostBasis)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {entries.length} stocks
          </p>
        </div>

        <div className="glass rounded-xl p-5 animate-fade-in stagger-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Top Performer
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-rose)]/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-[var(--color-accent-rose)]" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
            {summary.topPerformers[0]?.ticker || '-'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {summary.topPerformers[0] 
              ? formatCurrency(summary.topPerformers[0].annualDividend) 
              : 'No data'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Dividends Bar Chart */}
        <div className="lg:col-span-2 glass rounded-xl p-6 animate-fade-in stagger-5">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Monthly Dividend Projection
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d68f" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d68f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4d" />
                <XAxis 
                  dataKey="month" 
                  stroke="#8b9cb3" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#8b9cb3" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${currencySymbol}${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#00d68f" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers Pie Chart */}
        <div className="glass rounded-xl p-6 animate-fade-in stagger-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Income Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-[var(--color-text-secondary)]">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="glass rounded-xl p-6 animate-fade-in stagger-7">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Top Performing Stocks
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Ticker
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Annual Dividend
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Yield
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  DIVe
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Contribution
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.topPerformers.map((stock, index) => {
                const contribution = summary.totalAnnualDividends > 0 
                  ? (stock.annualDividend / summary.totalAnnualDividends) * 100 
                  : 0;
                return (
                  <tr 
                    key={stock.ticker} 
                    className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 
                          ? 'bg-[var(--color-accent-green)] text-[var(--color-bg-primary)]'
                          : index === 1
                          ? 'bg-[var(--color-accent-cyan)] text-[var(--color-bg-primary)]'
                          : index === 2
                          ? 'bg-[var(--color-accent-amber)] text-[var(--color-bg-primary)]'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[var(--color-text-primary)]">
                      {stock.ticker}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--color-accent-green)]">
                      {formatCurrency(stock.annualDividend)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--color-text-secondary)]">
                      {formatPercent(stock.yield)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--color-accent-amber)]">
                      {stock.expectedDividendYield != null ? formatPercent(stock.expectedDividendYield) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[var(--color-accent-green)] to-[var(--color-accent-cyan)] rounded-full"
                            style={{ width: `${contribution}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-[var(--color-text-muted)] w-12 text-right">
                          {contribution.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
