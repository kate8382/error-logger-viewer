export interface ErrorItem {
  id: string;
  message?: string;
  status?: string;
  type?: string;
  firstSeen?: string;
  lastSeen?: string;
  [k: string]: unknown;
}

export type NewError = Omit<ErrorItem, 'id' | 'firstSeen' | 'lastSeen'>;
export type Stats = Record<string, number>;
export type PeriodStats = Record<string, Stats>;
