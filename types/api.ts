import type { ErrorItem, NewError, Stats } from './errors';

export type Mode = 'server' | 'demo';

// интерфейс для API ошибок
export interface ErrorApi {
  mode: Mode;
  baseUrl: string;
  localKey?: string;
  getErrors(params?: Record<string, string | number | boolean | undefined>): Promise<ErrorItem[]>;
  getStats(by?: 'status' | 'type' | 'day'): Promise<Stats>;
  createError(data: NewError): Promise<ErrorItem>;
  deleteError(id: string): Promise<boolean>;
  updateError(id: string, data: Partial<NewError>): Promise<ErrorItem | null>;
  setMode(mode: Mode): void;
}
