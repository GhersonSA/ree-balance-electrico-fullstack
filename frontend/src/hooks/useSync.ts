import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerSync } from '../api/balance';
import type { GetBalanceParams } from '../api/balance';

export function useSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: GetBalanceParams) => triggerSync(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}
