import { useState } from 'react';
import dayjs from 'dayjs';
import { BalanceChart } from './components/BalanceChart';
import { DateRangeSelector } from './components/DateRangeSelector';
import { SyncStatusBadge } from './components/SyncStatusBadge';
import { useBalance } from './hooks/useBalance';
import { useSync } from './hooks/useSync';
import type { TimeTrunc } from './types/balance';
import './App.css';

const DEFAULT_END = dayjs().subtract(1, 'day').format('YYYY-MM-DDTHH:mm');
const DEFAULT_START = dayjs().subtract(30, 'day').format('YYYY-MM-DDTHH:mm');

function toIso(local: string): string {
  return new Date(local).toISOString();
}

function App() {
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [timeTrunc, setTimeTrunc] = useState<TimeTrunc>('day');

  const params = {
    startDate: toIso(startDate),
    endDate: toIso(endDate),
    timeTrunc,
  };

  const { data = [], isLoading, isError } = useBalance(params);
  const syncMutation = useSync();

  const loading = isLoading || syncMutation.isPending;
  const stale = syncMutation.data?.stale ?? false;
  const lastSyncAt = syncMutation.data?.lastSyncAt ?? null;
  const syncError = syncMutation.isError ? 'Error al sincronizar con REE.' : null;
  const fetchError = isError ? 'Error al cargar los datos. Verifica que el backend esté activo.' : null;

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
          onSync={() => syncMutation.mutate(params)}
        />

        {(fetchError || syncError) && (
          <div className="error-banner">{fetchError ?? syncError}</div>
        )}

        {isLoading && <div className="loading">Cargando datos...</div>}

        {!isLoading && <BalanceChart data={data} />}
      </main>
    </div>
  );
}

export default App;
