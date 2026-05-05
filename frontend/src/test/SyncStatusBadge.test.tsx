import { render, screen } from '@testing-library/react';
import { SyncStatusBadge } from '../components/SyncStatusBadge';

describe('SyncStatusBadge', () => {
  it('shows "Sin datos previos" when lastSyncAt is null', () => {
    render(<SyncStatusBadge stale={false} lastSyncAt={null} />);
    expect(screen.getByText(/Sin datos previos/i)).toBeInTheDocument();
  });

  it('renders ok badge when not stale', () => {
    render(<SyncStatusBadge stale={false} lastSyncAt="2024-04-01T10:00:00.000Z" />);
    const badge = screen.getByText(/Datos en tiempo real/i).closest('div');
    expect(badge).toHaveClass('badge--ok');
  });

  it('renders stale badge when REE is unavailable', () => {
    render(<SyncStatusBadge stale={true} lastSyncAt="2024-04-01T10:00:00.000Z" />);
    const badge = screen.getByText(/Datos desactualizados/i).closest('div');
    expect(badge).toHaveClass('badge--stale');
  });

  it('formats lastSyncAt date with correct date part', () => {
    render(<SyncStatusBadge stale={false} lastSyncAt="2024-03-15T12:00:00.000Z" />);
    expect(screen.getByText(/15\/03\/2024/)).toBeInTheDocument();
  });
});
