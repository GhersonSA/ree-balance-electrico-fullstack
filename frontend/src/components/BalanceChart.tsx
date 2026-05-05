import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

type ChartRow = {
  label: string;
  [indicatorName: string]: number | string;
};

const INDICATOR_COLORS: Record<string, string> = {
  'Renovable': '#22c55e',
  'No renovable': '#ef4444',
  'Nuclear': '#a855f7',
  'Hidráulica': '#3b82f6',
  'Eólica': '#06b6d4',
  'Solar fotovoltaica': '#f59e0b',
  'Solar térmica': '#f97316',
  'Ciclo combinado': '#64748b',
  'Carbón': '#78716c',
  'Fuel + Gas': '#d97706',
};

function getFillColor(indicatorName: string): string {
  for (const [key, color] of Object.entries(INDICATOR_COLORS)) {
    if (indicatorName.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#94a3b8';
}

export function BalanceChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay datos para el rango seleccionado.</p>
      </div>
    );
  }

  // Group by timestamp → { timestamp, [indicatorName]: value }
  const byTimestamp = new Map<string, ChartRow>();
  const indicatorNames = new Set<string>();

  for (const point of data) {
    const label = dayjs(point.timestamp).format('DD/MM HH:mm');
    if (!byTimestamp.has(label)) byTimestamp.set(label, { label });
    byTimestamp.get(label)![point.indicatorName] = parseFloat(point.value);
    indicatorNames.add(point.indicatorName);
  }

  const chartData = Array.from(byTimestamp.values());
  const indicators = Array.from(indicatorNames);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" MW" />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
          itemStyle={{ color: '#94a3b8' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        {indicators.map((name) => (
          <Bar key={name} dataKey={name} stackId="a" fill={getFillColor(name)} radius={[2, 2, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
