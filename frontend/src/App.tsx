import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { getBalance, triggerSync } from './api/balance';
import { BalanceChart } from './components/BalanceChart';
import { DateRangeSelector } from './components/DateRangeSelector';
import { SyncStatusBadge } from './components/SyncStatusBadge';
import type { BalancePoint, TimeTrunc } from './types/balance';
import './App.css';

const DEFAULT_END = dayjs().format('YYYY-MM-DDTHH:mm');
const DEFAULT_START = dayjs().subtract(1, 'day').format('YYYY-MM-DDTHH:mm');

function toIso(local: string): string {
  return new Date(local).toISOString();
}

function App() {
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [timeTrunc, setTimeTrunc] = useState<TimeTrunc>('hour');
  const [data, setData] = useState<BalancePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const points = await getBalance({
        startDate: toIso(startDate),
        endDate: toIso(endDate),
        timeTrunc,
      });
      setData(points);
    } catch {
      setError('Error al cargar los datos. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, timeTrunc]);

  const handleSync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await triggerSync({
        startDate: toIso(startDate),
        endDate: toIso(endDate),
        timeTrunc,
      });
      setStale(result.stale);
      setLastSyncAt(result.lastSyncAt);
      await fetchData();
    } catch {
      setError('Error al sincronizar con REE.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, timeTrunc, fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Balance Eléctrico REE</h1>
        <SyncStatusBadge stale={stale} lastSyncAt={lastSyncAt} />
      </header>

      <main className="app-main">
        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          timeTrunc={timeTrunc}
          loading={loading}
          onChange={({ startDate, endDate, timeTrunc }) => {
            setStartDate(startDate);
            setEndDate(endDate);
            setTimeTrunc(timeTrunc);
          }}
          onSync={handleSync}
        />

        {error && <div className="error-banner">{error}</div>}

        {loading && <div className="loading">Cargando datos...</div>}

        {!loading && <BalanceChart data={data} />}
      </main>
    </div>
  );
}

export default App;
