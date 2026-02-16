import '../assets/scss/style.scss';
import type { ErrorItem, NewError } from 'errors';
import type { Mode } from 'api';
import { ErrorApi } from './api';
import './header';
import { StatsManager } from './stats';
import ChartManager from './charts';
import type { ChartManagerType } from './charts'; // Импорт типа ChartManager чтобы приводить созданный инстанс к правильному типу (вместо ambient-описание в global.d.ts)
import type { Aside } from './aside'; // Импорт типа Aside для приведения динамически загруженного синглтона
import { ErrorTable } from './table';

import { onLangChange } from './utils/i18n';
import { updateTestErrorButtonVisibility } from './utils/testErrorButton';
import handleModuleLoadError from './utils/moduleLoad';

// Инициализация таблицы ошибок и статистики
window.errorTableInstance = new ErrorTable('server');
// Асинхронная инициализация statsManager после загрузки ошибок
async function initStatsManager() {
  let errors: ErrorItem[] = [];
  try {
    errors = await new ErrorApi().getErrors({});
  } catch (e) {
    console.error('[StatsManager] Error loading errors:', e);
  }
  window.statsManager = new StatsManager(errors);
  // Приводим глобальный синглтон к локальному типу перед вызовом методов
  const sm = window.statsManager as unknown as StatsManager | undefined;
  if (sm && typeof sm.renderErrorCards === 'function') {
    sm.renderErrorCards();
  }
}
initStatsManager();

// Главный класс приложения - инициализирует API, обработчики ошибок и aside
class ErrorLoggerApp {
  errorApi: ErrorApi;

  constructor(mode: Mode = 'server') {
    this.errorApi = new ErrorApi(mode);
    // Язык и переводы теперь централизованы через i18n.js
    this.init();
  }

  // Инициализация приложения
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      import('./aside')
        .then(({ Aside }) => {
          // Динамический импорт (lazy loading) для отложенной загрузки aside
          window.aside = new Aside();
          // Приводим глобальный aside к типу и используем локальную переменную для вызовов
          const asideLocal = window.aside as unknown as Aside | undefined;
          if (asideLocal && typeof asideLocal.translatePage === 'function') {
            // `translatePage` не принимает аргументы — он читает текущий язык из i18n.
            asideLocal.translatePage();
            onLangChange(() => asideLocal?.translatePage?.());
          }
        })
        .catch((err) => {
          handleModuleLoadError('Failed to load aside module', err);
        });
      this.setupErrorListeners();
      // Инициализация ChartManager только один раз глобально
      if (!window.chartManager) {
        // Явное приведение нового объекта к `ChartManagerType` для корректной типизации
        window.chartManager = new ChartManager() as ChartManagerType;
      }
    });
  }

  async updateErrorTable(): Promise<void> {
    if (!window.renderErrorTable) return;
    const errors = await this.errorApi.getErrors({});
    window.renderErrorTable(errors);
    // Локальное приведение глобального синглтона к корректному типу
    {
      const sm = window.statsManager as unknown as StatsManager | undefined;
      if (sm) {
        sm.errors = errors;
        sm.renderErrorCards && sm.renderErrorCards();
      }
    }
    // Локальное приведение `chartManager` для безопасного вызова методов
    {
      const cm = window.chartManager as unknown as ChartManagerType | undefined;
      if (cm && typeof cm.renderChart === 'function') cm.renderChart();
    }
  }

  // Универсальный обработчик создания ошибки и обновления UI
  async handleErrorCreate(errorData: NewError): Promise<ErrorItem> {
    const created = await this.errorApi.createError(errorData);
    this.updateErrorTable();
    return created;
  }

  setupErrorListeners() {
    // Глобальный обработчик ошибок загрузки ресурсов (скрипты, стили, изображения)
    window.addEventListener(
      'error',
      (event: Event) => {
        const target = (event.target ?? (event as unknown as { srcElement?: EventTarget }).srcElement) as EventTarget | null;
        if (target && (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement)) {
          let src = '';
          if (target instanceof HTMLScriptElement) src = target.src || '';
          else if (target instanceof HTMLLinkElement) src = target.href || '';
          else if (target instanceof HTMLImageElement) src = target.currentSrc || target.src || '';
          const tag = (target as Element).tagName;
          this.handleErrorCreate({
            type: 'ResourceLoadError',
            message: `Failed to load resource: ${tag}`,
            source: src,
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
          });
        }
      },
      true,
    );

    // Глобальный обработчик ошибок JavaScript (onerror: message - ошибка в коде, source - файл, lineno - строка, colno - столбец)
    window.onerror = (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error | null) => {
      console.log('[ErrorLogger] Creating JS error:', message);
      this.handleErrorCreate({
        type: error && error.name ? error.name : 'Error',
        message: String(message),
        source: String(source),
        lineno,
        colno,
        stack: error && error.stack ? error.stack : '',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
    };

    // Глобальный обработчик необработанных промиссов (unhandledrejection)
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      console.log('[ErrorLogger] Creating Promise error:', event.reason);
      this.handleErrorCreate({
        type: 'UnhandledPromiseRejection',
        message: event.reason ? String(event.reason) : 'Promise rejected',
        stack: (event.reason as unknown as { stack?: string })?.stack ?? undefined,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
    };

    const origFetch = window.fetch;
    // Переопределение fetch для логирования ошибок
    window.fetch = async (...args) => {
      try {
        const response = await origFetch(...args);
        if (!response.ok) {
          console.log('[ErrorLogger] Creating Fetch error:', response.status, response.statusText);
          this.handleErrorCreate({
            type: 'FetchError',
            message: `Fetch failed: ${response.status} ${response.statusText}`,
            source: args[0],
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
          });
        }
        return response;
      } catch (error) {
        const err = error as unknown as { message?: string, stack?: string };
        console.log('[ErrorLogger] Creating Fetch error:', err?.message || err);
        this.handleErrorCreate({
          type: 'FetchError',
          message: err?.message ? String(err.message) : String(err),
          source: args[0],
          stack: err?.stack,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
        throw error;
      }
    };

    // Дополнительный глобальный обработчик ошибок через addEventListener
    window.addEventListener(
      'error',
      function (event: ErrorEvent) {
        if (event.error) {
          // Это JS-ошибка (TypeError, SyntaxError и др.)
          if (window.app && window.app.errorApi) {
            const evErr = event.error as unknown as { name?: string, message?: string, stack?: string } | undefined;
            const evMeta = event as unknown as { filename?: string, lineno?: number, colno?: number };
            window.app.errorApi.createError({
              type: evErr?.name || 'Error',
              message: evErr?.message || String(event.message),
              source: evMeta.filename || undefined,
              lineno: evMeta.lineno || undefined,
              colno: evMeta.colno || undefined,
              stack: evErr?.stack || '',
              firstSeen: new Date().toISOString(),
              lastSeen: new Date().toISOString(),
            });
          }
        }
      },
      true,
    );
  }

  // Получаем ошибки из localStorage
  async flushLocalErrors() {
    const key = 'errorsLocal';
    let errors: ErrorItem[] = [];
    try {
      errors = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      console.error('[ErrorLogger] Failed to parse pending errors from localStorage:', e);
      return;
    }
    if (!errors.length) return;
    for (const err of errors) {
      try {
        await this.errorApi.createError(err);
      } catch (e) {
        console.error('[ErrorLogger] Failed to create error:', e);
        return;
      }
    }
    localStorage.removeItem(key);
    this.updateErrorTable();
  }
}
// Инициализация приложения
/* Автоматически выбираем режим: на локальной машине используем 'server', на публичном хостинге (gh-pages и т.п.) — 'demo', чтобы не пытаться обращаться к localhost:3000 */
// prettier-ignore
const defaultMode: Mode =
  typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
    ? 'server'
    : 'demo';

const app = new ErrorLoggerApp(defaultMode);
window.app = app;
app.flushLocalErrors();

// Инициализация кнопки создания тестовой ошибки
document.addEventListener('DOMContentLoaded', updateTestErrorButtonVisibility);

// Следим за сменой режима (через aside)
window.addEventListener('modeChanged', async () => {
  updateTestErrorButtonVisibility();
  const mode = window.app && window.app.errorApi ? window.app.errorApi.mode : 'server';
  if (mode === 'server' && window.app && typeof window.app.flushLocalErrors === 'function') {
    await window.app.flushLocalErrors();
    if (typeof window.app.updateErrorTable === 'function') {
      window.app.updateErrorTable();
    }
  }
});
