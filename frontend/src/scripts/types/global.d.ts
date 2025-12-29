import type { ErrorItem } from './errors';

// Этот файл расширяет глобальные типы window для приложения.
// Здесь определяем минимальные интерфейсы для глобальных менеджеров.

declare global {
  interface ErrorTableInterface {
    errors?: ErrorItem[];
    errorApi?: any;
    lang?: 'en' | 'ru';
    getErrors?: () => ErrorItem[];
    renderErrors?: (errs: ErrorItem[] | undefined) => void;
    fetchErrors?: () => void;
    sortErrors?: (errs: ErrorItem[], field: string, order: string) => ErrorItem[];
    setMode?: (mode: 'server' | 'demo') => void;
  }

  interface StatsManagerInterface {
    renderErrorCards?: () => void;
  }

  interface ChartManagerInterface {
    resetToDefault?: () => void;
    renderChart?: () => void;
  }

  interface Window {
    app?: {
      errorApi?: any,
      updateErrorTable?: () => void,
      lang?: 'en' | 'ru',
    };
    onLangChange?: (fn: (lang: 'en' | 'ru') => void) => void;
    errorTableInstance?: ErrorTableInterface;
    statsManager?: StatsManagerInterface;
    chartManager?: ChartManagerInterface;
    headerManager?: any;
    API_BASE_URL?: string;
    aside?: any;
  }
}

export {};
