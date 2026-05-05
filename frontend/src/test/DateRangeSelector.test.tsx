import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeSelector } from '../components/DateRangeSelector';

const DEFAULT_PROPS = {
  startDate: '2024-01-01T00:00',
  endDate: '2024-01-31T23:59',
  timeTrunc: 'day' as const,
  onChange: vi.fn(),
  onSync: vi.fn(),
  loading: false,
};

describe('DateRangeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders start date, end date and aggregation inputs', () => {
    render(<DateRangeSelector {...DEFAULT_PROPS} />);
    expect(screen.getByLabelText(/Desde/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hasta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Agregación/i)).toBeInTheDocument();
  });

  it('renders Día and Mes options but not Hora', () => {
    render(<DateRangeSelector {...DEFAULT_PROPS} />);
    expect(screen.getByRole('option', { name: 'Día' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mes' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Hora' })).not.toBeInTheDocument();
  });

  it('calls onChange with new startDate when input changes', async () => {
    render(<DateRangeSelector {...DEFAULT_PROPS} />);
    const input = screen.getByLabelText(/Desde/i);
    await userEvent.clear(input);
    await userEvent.type(input, '2024-02-01T00:00');
    expect(DEFAULT_PROPS.onChange).toHaveBeenCalled();
  });

  it('calls onSync when Sincronizar button is clicked', async () => {
    render(<DateRangeSelector {...DEFAULT_PROPS} />);
    await userEvent.click(screen.getByRole('button', { name: /Sincronizar/i }));
    expect(DEFAULT_PROPS.onSync).toHaveBeenCalledOnce();
  });

  it('disables Sincronizar button when loading is true', () => {
    render(<DateRangeSelector {...DEFAULT_PROPS} loading={true} />);
    expect(screen.getByRole('button', { name: /Sincronizando/i })).toBeDisabled();
  });
});
