import type { ErrorItem } from './errors';
import type { ErrorApi, Mode } from './api';

// Локальное определение минимального API ChartManager, чтобы сборка деклараций
// не зависела от исходников фронтенда.
export type ChartManagerType = {
  renderChart: (canvasId: string | HTMLElement, data: unknown) => void;
  updateFontSize?: (size: number) => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    API_BASE_URL?: string;
    app?: {
      errorApi?: ErrorApi;
      updateErrorTable?: () => void;
      flushLocalErrors?: () => Promise<void> | void;
      lang?: 'en' | 'ru';
    };

    renderErrorTable?: (errors?: ErrorItem[] | undefined) => void;
    errorTableInstance?: {
      getErrors?: () => ErrorItem[] | undefined;
      renderErrors?: (errs?: ErrorItem[] | undefined) => void;
      fetchErrors?: () => Promise<void> | void;
      setMode?: (mode: Mode) => void;
    } | undefined;
    statsManager?: { renderErrorCards?: () => void; errors?: ErrorItem[] } | undefined;
    chartManager?: ChartManagerType | null;
    aside?: { setTheme?: (theme: string) => void; translatePage?: (lang?: 'en' | 'ru') => void } | null;

    headerManager?: { filterTable?: (query?: string) => Promise<void> | void; filteredErrors?: ErrorItem[] | undefined } | null;

    closeCustomSelectModal?: (e?: MouseEvent) => void;
    __errorTableDropdownListenerAdded?: boolean;
    appModal?: { openEdit?: (err: ErrorItem, _?: boolean) => void; deleteError?: (id: string) => void } | undefined;
  }
}

export {};
