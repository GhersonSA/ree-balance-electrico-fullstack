export interface BalancePoint {
  id: string;
  timestamp: string;
  indicatorType: string;
  indicatorName: string;
  value: string;
  percentage: string | null;
  unit: string | null;
  timeTrunc: string;
  source: string;
}

export interface SyncResult {
  inserted: number;
  stale: boolean;
  lastSyncAt: string | null;
}

export type TimeTrunc = 'hour' | 'day' | 'month';
