import type { ErrorItem } from './errors';
import type { Mode, ErrorApi } from '../api';

// Этот файл расширяет глобальные типы window для приложения.
// Здесь определяем минимальные интерфейсы для глобальных менеджеров.

declare global {
  // тип поля для сортировки
  type FieldName = 'id' | 'type' | 'count' | 'firstSeen' | 'lastSeen' | 'status';

  // Интерфейс для таблицы ошибок
  interface ErrorTableInterface {
    errors?: ErrorItem[];
    errorApi?: ErrorApi;
    getErrors?: () => ErrorItem[] | undefined;
    renderErrors?: (errs: ErrorItem[] | undefined) => void;
    fetchErrors?: () => Promise<void> | void;
    sortErrors?: (errors: ErrorItem[], field: string, order: string) => ErrorItem[];
    setMode?: (mode: Mode) => void;
  }

  interface StatsManagerInterface {
    renderErrorCards?: () => void;
  }

  interface ChartManagerInterface {
    resetToDefault?: () => void;
    renderChart?: () => void;
  }

  interface AppInterface {
    errorApi?: ErrorApi;
    updateErrorTable?: () => void;
    lang?: 'en' | 'ru';
  }

  interface AppModalInterface {
    open?: (payload?: any) => void;
    close?: () => void;
    openEdit: (err: ErrorItem, _isLangChange?: boolean) => void;
    deleteError: (id: string, _isLangChange?: boolean) => Promise<void> | void;
  }

  interface HeaderManagerInterface {
    filterTable?: (query?: string) => Promise<void> | void;
    filteredErrors?: ErrorItem[];
  }

  interface AsideInterface {
    setTheme?: (theme: string) => void;
  }

  interface Window {
    app?: AppInterface;
    onLangChange?: (fn: (lang: 'en' | 'ru') => void) => void;
    renderErrorTable?: (errors?: ErrorItem[] | undefined) => void;
    errorTableInstance?: ErrorTableInterface;
    appModal?: AppModalInterface;
    statsManager?: StatsManagerInterface;
    chartManager?: ChartManagerInterface;
    headerManager?: HeaderManagerInterface | null;
    API_BASE_URL?: string;
    aside?: AsideInterface | null;
    // внутренние helpers для modal.ts
    closeCustomSelectModal?: (e?: MouseEvent) => void;
    __errorTableDropdownListenerAdded?: boolean;
  }
}

export {};
