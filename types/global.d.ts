import type { ErrorItem } from '../types/errors';
import type { ErrorApi, Mode } from '../types/api';
import type { ChartManagerType } from '../frontend/src/scripts/charts';

// Минимальная публичная поверхность `window` для рантайма.
// Оставляем только реально необходимое для взаимодействия между ленивыми модулями, чтобы не держать огромный ambient-файл и позволить модулям импортировать свои типы явно.

declare global {
  interface Window {
    API_BASE_URL?: string;
    // Основной публичный объект приложения (не дублируем всю реализацию)
    app?: {
      errorApi?: ErrorApi;
      updateErrorTable?: () => void;
      flushLocalErrors?: () => Promise<void> | void;
      lang?: 'en' | 'ru';
    };

    // Небольшие точки входа, которые реально используются в коде
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

    // Header manager used for cross-component filtering state
    headerManager?: { filterTable?: (query?: string) => Promise<void> | void; filteredErrors?: ErrorItem[] | undefined } | null;

    // Вспомогательные runtime-флаги/хелперы
    closeCustomSelectModal?: (e?: MouseEvent) => void;
    __errorTableDropdownListenerAdded?: boolean;
    appModal?: { openEdit?: (err: ErrorItem, _?: boolean) => void; deleteError?: (id: string) => void } | undefined;
  }
}

export {};
