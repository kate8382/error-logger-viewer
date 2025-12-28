/* eslint-disable no-unused-vars */
// Этот файл расширяет глобальные типы `window` для приложения.
// Используем простые локальные подписи, чтобы файл оставался ambient (без import/export).

interface Window {
  app?: {
    // Ошибка API — оставляем как any, чтобы не вносить жесткие зависимости
    errorApi?: any,
    updateErrorTable?: () => void,
    lang?: 'en' | 'ru',
  };
  onLangChange?: (fn: (lang: 'en' | 'ru') => void) => void;
  // Интерфейс для таблицы ошибок (используется в header и прочих модулях)
  errorTableInstance?: {
    errors?: any[],
    errorApi?: any,
    lang?: 'en' | 'ru',
    getErrors?: () => any[],
    renderErrors?: (errs: any[]) => void,
    fetchErrors?: () => void,
    sortErrors?: (errs: any[], field: string, order: string) => any[],
    setMode?: (mode: 'server' | 'demo') => void,
  };
  // Менеджер статистики (упрощённые подписи)
  statsManager?: {
    renderErrorCards?: () => void,
  };
  // Менеджер чарта (упрощённые подписи)
  chartManager?: {
    resetToDefault?: () => void,
  };
  headerManager?: any;
  API_BASE_URL?: string;
  aside?: any;
}
