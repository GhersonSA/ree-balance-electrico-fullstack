import axios from 'axios';
import type { BalancePoint, SyncResult, TimeTrunc } from '../types/balance';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
});

export interface GetBalanceParams {
  startDate: string;
  endDate: string;
  timeTrunc: TimeTrunc;
}

export async function getBalance(params: GetBalanceParams): Promise<BalancePoint[]> {
  const { data } = await api.get<BalancePoint[]>('/balance', { params });
  return data;
}

export async function triggerSync(params: GetBalanceParams): Promise<SyncResult> {
  const { data } = await api.post<SyncResult>('/balance/sync', params);
  return data;
}
