import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import type { BalancePoint } from '../types/balance';

interface Props {
  data: BalancePoint[];
  theme?: 'light' | 'dark';
}

// renovable, no-renovable or demanda
function classifyIndicator(name: string): 'renovable' | 'no-renovable' | 'demanda' | null {
  const lower = name.toLowerCase();
  if (lower.includes('demanda')) return 'demanda';
  if (lower.includes('renovable') && !lower.includes('no renovable') && !lower.includes('no renovables')) return 'renovable';
  if (lower.includes('no renovable')) return 'no-renovable';
  return null;
}

function buildAdaptiveTicks(
  chartData: Array<{ label: string; ts: string }>,
  maxTicks = 12,
): { ticks: string[]; formatByLabel: Map<string, string> } {
  const formatByLabel = new Map<string, string>();
  const firstIndex = 0;
  const lastIndex = chartData.length - 1;
  const selected = new Set<number>([firstIndex]);

  for (let i = 1; i <= lastIndex; i += 1) {
    const current = dayjs(chartData[i].ts);
    const previous = dayjs(chartData[i - 1].ts);
    const isNewMonth = current.month() !== previous.month() || current.year() !== previous.year();
    if (isNewMonth) selected.add(i);
  }

  selected.add(lastIndex);

  let sortedIndices = Array.from(selected).sort((a, b) => a - b);

  if (sortedIndices.length > maxTicks) {
    const middle = sortedIndices.slice(1, -1);
    const keepMiddle = Math.max(0, maxTicks - 2);
    const sampledMiddle: number[] = [];
    for (let step = 1; step <= keepMiddle; step += 1) {
      const pos = Math.floor((step * middle.length) / (keepMiddle + 1));
      if (middle[pos] !== undefined) sampledMiddle.push(middle[pos]);
    }
    sortedIndices = [firstIndex, ...Array.from(new Set(sampledMiddle)), lastIndex].sort((a, b) => a - b);
  }

  const ticks = sortedIndices.map((idx) => chartData[idx].label);

  for (const idx of sortedIndices) {
    const d = dayjs(chartData[idx].ts);
    formatByLabel.set(chartData[idx].label, d.format('MM/YY'));
  }

  return { ticks, formatByLabel };
}

export function BalanceChart({ data, theme = 'light' }: Props) {
  const chartPalette =
    theme === 'dark'
      ? {
          grid: '#2e455d',
          axis: '#3d5771',
          tick: '#9cb1c6',
          tooltipBg: '#162739',
          tooltipBorder: '#3a556f',
          tooltipLabel: '#e7f1fb',
          tooltipItem: '#d7e5f2',
          legend: '#c6d7e8',
          line: '#b4d8ff',
        }
      : {
          grid: '#d7e0eb',
          axis: '#c9d6e3',
          tick: '#607080',
          tooltipBg: '#ffffff',
          tooltipBorder: '#d8e2ee',
          tooltipLabel: '#103a5d',
          tooltipItem: '#1f2d3d',
          legend: '#32526f',
          line: '#103a5d',
        };

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay datos para el rango seleccionado.</p>
      </div>
    );
  }

  // renovable, no-renovable, demanda
  type AggRow = { label: string; ts: string; renovable: number; 'no renovable': number; demanda: number };
  const byTimestamp = new Map<string, AggRow>();

  for (const point of data) {
    const ts = point.timestamp;
    const label = dayjs(ts).format('DD/MM/YY');
    if (!byTimestamp.has(ts)) {
      byTimestamp.set(ts, { label, ts, renovable: 0, 'no renovable': 0, demanda: 0 });
    }
    const row = byTimestamp.get(ts)!;
    const cls = classifyIndicator(point.indicatorName);
    const val = parseFloat(point.value);
    if (cls === 'renovable') row.renovable = val;
    else if (cls === 'no-renovable') row['no renovable'] = val;
    else if (cls === 'demanda') row.demanda = val;
  }

  const chartData = Array.from(byTimestamp.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);

  const { ticks: adaptiveTicks, formatByLabel } = buildAdaptiveTicks(chartData, 12);

  const formatXAxisTick = (value: string): string => {
    return formatByLabel.get(value) ?? '';
  };

  return (
    <div className="balance-chart">
      <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="grad-renovable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2ca56d" stopOpacity={0.92} />
            <stop offset="100%" stopColor="#2ca56d" stopOpacity={0.45} />
          </linearGradient>
          <linearGradient id="grad-norenovable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#53c9e6" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#53c9e6" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} vertical={false} />
        <XAxis
          dataKey="label"
          ticks={adaptiveTicks}
          tick={{ fill: chartPalette.tick, fontSize: 11 }}
          interval={0}
          tickFormatter={formatXAxisTick}
          minTickGap={48}
          axisLine={{ stroke: chartPalette.axis }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: chartPalette.tick, fontSize: 11 }}
          unit=" MW"
          width={78}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: chartPalette.tooltipBg, border: `1px solid ${chartPalette.tooltipBorder}`, borderRadius: 8, boxShadow: '0 8px 20px rgba(8, 35, 60, 0.12)' }}
          labelStyle={{ color: chartPalette.tooltipLabel, fontWeight: 700, marginBottom: 4 }}
          itemStyle={{ fontSize: 12, color: chartPalette.tooltipItem }}
          formatter={(value, name) => [typeof value === 'number' ? `${value.toLocaleString('es-ES')} MW` : String(value), name as string]}
        />
        <Legend
          wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
          formatter={(value) => <span style={{ color: chartPalette.legend }}>{value}</span>}
        />
        <Bar dataKey="renovable" name="Renovable" stackId="gen" fill="url(#grad-renovable)" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="no renovable" name="No renovable" stackId="gen" fill="url(#grad-norenovable)" radius={[3, 3, 0, 0]} maxBarSize={18} />

        <Line
          type="monotone"
          dataKey="demanda"
          name="Demanda"
          stroke={chartPalette.line}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0, fill: chartPalette.line }}
        />
      </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
