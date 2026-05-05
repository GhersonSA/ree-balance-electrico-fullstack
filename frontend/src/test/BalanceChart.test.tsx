import { render, screen } from '@testing-library/react';
import { BalanceChart } from '../components/BalanceChart';
import type { BalancePoint } from '../types/balance';

(window as unknown as Record<string, unknown>).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function makePoint(overrides: Partial<BalancePoint>): BalancePoint {
  return {
    id: '1',
    timestamp: '2024-01-15T00:00:00.000Z',
    indicatorName: 'Generación renovable',
    indicatorType: 'Renovable',
    value: '12345.67',
    percentage: '60',
    unit: null,
    source: 'REE',
    timeTrunc: 'day',
    ...overrides,
  };
}

describe('BalanceChart', () => {
  it('shows empty-state message when data is empty', () => {
    render(<BalanceChart data={[]} />);
    expect(screen.getByText(/No hay datos para el rango seleccionado/i)).toBeInTheDocument();
  });

  it('renders the recharts container when data is provided', () => {
    const data: BalancePoint[] = [
      makePoint({ indicatorName: 'Generación renovable', value: '10000' }),
      makePoint({ indicatorName: 'Generación no renovable', value: '5000' }),
      makePoint({ indicatorName: 'Demanda en b.c.', value: '15000' }),
    ];
    const { container } = render(<BalanceChart data={data} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('does not render empty-state when data has items', () => {
    const data: BalancePoint[] = [makePoint({})];
    render(<BalanceChart data={data} />);
    expect(screen.queryByText(/No hay datos/i)).not.toBeInTheDocument();
  });
});
