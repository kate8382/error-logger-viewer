export interface ErrorItem {
  id: string;
  message?: string;
  status?: string;
  type?: string;
  firstSeen?: string;
  lastSeen?: string;
  [k: string]: unknown;
}
export type NewError = Omit<ErrorItem, 'id' | 'firstSeen' | 'lastSeen'>; // Omit исключает указанные ключи из типа
export type Stats = Record<string, number>; // Record представляет объект с ключами-строками и значениями-числами
export type PeriodStats = Record<string, Stats>; // Статистика, сгруппированная по периодам (period -> { key: count })
