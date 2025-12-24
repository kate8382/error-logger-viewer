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
  errorTableInstance?: {
    setMode?: (mode: 'server' | 'demo') => void,
  };
  API_BASE_URL?: string;
  aside?: any;
}
