import type { TimeTrunc } from '../types/balance';

interface Props {
  startDate: string;
  endDate: string;
  timeTrunc: TimeTrunc;
  onChange: (values: { startDate: string; endDate: string; timeTrunc: TimeTrunc }) => void;
  onSync: () => void;
  loading: boolean;
}

const TRUNC_OPTIONS: { value: TimeTrunc; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'month', label: 'Mes' },
];

export function DateRangeSelector({ startDate, endDate, timeTrunc, onChange, onSync, loading }: Props) {
  return (
    <div className="date-range-selector">
      <div className="field">
        <label htmlFor="startDate">Desde</label>
        <input
          id="startDate"
          type="datetime-local"
          value={startDate}
          onChange={(e) => onChange({ startDate: e.target.value, endDate, timeTrunc })}
        />
      </div>

      <div className="field">
        <label htmlFor="endDate">Hasta</label>
        <input
          id="endDate"
          type="datetime-local"
          value={endDate}
          onChange={(e) => onChange({ startDate, endDate: e.target.value, timeTrunc })}
        />
      </div>

      <div className="field">
        <label htmlFor="timeTrunc">Agregación</label>
        <select
          id="timeTrunc"
          value={timeTrunc}
          onChange={(e) => onChange({ startDate, endDate, timeTrunc: e.target.value as TimeTrunc })}
        >
          {TRUNC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button onClick={onSync} disabled={loading} className="sync-btn">
        {loading ? 'Sincronizando...' : 'Sincronizar REE'}
      </button>
    </div>
  );
}
