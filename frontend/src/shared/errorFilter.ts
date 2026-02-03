import type { ErrorItem } from '../../../types/errors';
// eslint-disable-next-line prettier/prettier
import type * as I18n from '../scripts/utils/i18n';

// Функция для получения даты в формате ДД.ММ.ГГГГ из строки даты
export function getDateOnly(str?: string): string {
  if (!str) return '';
  const date = new Date(str);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Типы для функций i18n
type I18nHelpers = {
  getLabel?: typeof I18n.getLabel,
  t?: typeof I18n.t,
};

// Фильтрация списка ошибок по поисковому запросу с учетом i18n
export function filterErrors(errors: ErrorItem[] | undefined, query: string, { getLabel = ((s?: string) => (s ? String(s) : undefined)) as typeof I18n.getLabel, t = ((k?: string) => (k ? String(k) : '')) as typeof I18n.t }: I18nHelpers = {}): ErrorItem[] {
  const q = (query || '').toLowerCase().trim();
  if (!q) return Array.isArray(errors) ? errors : [];
  const list = Array.isArray(errors) ? errors : [];
  return list.filter((error) => {
    const typeText = getLabel ? getLabel(error.type) : undefined;
    const statusText = t ? t(error.status || 'new') : error.status || 'new';
    const firstSeenDate = getDateOnly(error.firstSeen);
    const lastSeenDate = getDateOnly(error.lastSeen);
    return [error.id, error.type, typeText, error.status, statusText, firstSeenDate, lastSeenDate].some((val) => val && String(val).toLowerCase().includes(q));
  });
}

export default { filterErrors, getDateOnly };
