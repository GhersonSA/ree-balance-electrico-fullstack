import dayjs from 'dayjs';

interface Props {
  stale: boolean;
  lastSyncAt: string | null;
}

export function SyncStatusBadge({ stale, lastSyncAt }: Props) {
  const formattedDate = lastSyncAt
    ? dayjs(lastSyncAt).format('DD/MM/YYYY HH:mm')
    : 'Sin datos previos';

  if (stale) {
    return (
      <div className="badge badge--stale">
        <span className="badge__dot" />
        <span>Datos desactualizados · REE no disponible · Última sync: {formattedDate}</span>
      </div>
    );
  }

  return (
    <div className="badge badge--ok">
      <span className="badge__dot" />
      <span>Datos en tiempo real · Última sync: {formattedDate}</span>
    </div>
  );
}
