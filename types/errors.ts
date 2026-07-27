// backend: создаем интерфейс для ошибки
export interface ErrorDTO {
  id: string;
  projectId: string;
  type?: string;
  message: string;
  stack?: string;
  // Closed union — do not add `| string` here; that makes the type meaningless.
  // Use 'unknown' only as a temporary fallback for legacy records that predate this schema.
  status?: 'new' | 'in_progress' | 'fixed' | 'ignored' | 'unknown';
  comment?: string;
  count?: number;
  firstSeen?: string;
  lastSeen?: string;
  users?: string[];
}

// backend: интерфейс для запроса на создание ошибки
export interface CreateErrorRequest {
  message: string;
  stack?: string;
  type?: string;
  apiKey?: string;
  projectId?: string;
  user?: string;
}

// backend: интерфейс для запроса на обновление ошибки
export interface UpdateErrorRequest extends Partial<ErrorDTO> {
  id: string;
}

// frontend: интерфейс для отображения ошибки
export interface ErrorItem {
  id: string;
  message?: string;
  status?: string;
  type?: string;
  firstSeen?: string;
  lastSeen?: string;
  [k: string]: unknown;
}

// frontend-типы для: новой ошибки (без id и дат), статистики по ошибкам и статистики по периодам
export type NewError = Omit<ErrorItem, 'id' | 'firstSeen' | 'lastSeen'>;
export type Stats = Record<string, number>;
export type PeriodStats = Record<string, Stats>;
