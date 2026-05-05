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
}

// renovable, no-renovable or demanda
function classifyIndicator(name: string): 'renovable' | 'no-renovable' | 'demanda' | null {
  const lower = name.toLowerCase();
  if (lower.includes('demanda')) return 'demanda';
  if (lower.includes('renovable') && !lower.includes('no renovable') && !lower.includes('no renovables')) return 'renovable';
  if (lower.includes('no renovable')) return 'no-renovable';
  return null;
}

function computeTickInterval(totalPoints: number): number {
  if (totalPoints <= 30) return 0;
  if (totalPoints <= 90) return Math.ceil(totalPoints / 15);
  if (totalPoints <= 365) return Math.ceil(totalPoints / 12);
  return Math.ceil(totalPoints / 10);
}

export function BalanceChart({ data }: Props) {
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

  const tickInterval = computeTickInterval(chartData.length);

  return (
    <ResponsiveContainer width="100%" height={420}>
      <ComposedChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="grad-renovable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id="grad-norenovable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 11 }}
          interval={tickInterval}
          minTickGap={48}
          axisLine={{ stroke: '#1e293b' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          unit=" MW"
          width={78}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}
          itemStyle={{ fontSize: 12 }}
          formatter={(value, name) => [typeof value === 'number' ? `${value.toLocaleString('es-ES')} MW` : String(value), name as string]}
        />
        <Legend
          wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
          formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
        />
        <Bar dataKey="renovable" name="Renovable" stackId="gen" fill="url(#grad-renovable)" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="no renovable" name="No renovable" stackId="gen" fill="url(#grad-norenovable)" radius={[3, 3, 0, 0]} maxBarSize={18} />

        <Line
          type="monotone"
          dataKey="demanda"
          name="Demanda"
          stroke="#f8fafc"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0, fill: '#f8fafc' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
