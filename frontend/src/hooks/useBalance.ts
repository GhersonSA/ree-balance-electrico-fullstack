import { useQuery } from '@tanstack/react-query';
import { getBalance } from '../api/balance';
import type { GetBalanceParams } from '../api/balance';

export function useBalance(params: GetBalanceParams) {
  return useQuery({
    queryKey: ['balance', params.startDate, params.endDate, params.timeTrunc],
    queryFn: () => getBalance(params),
    staleTime: 1000 * 60 * 5,
  });
}
