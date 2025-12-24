import '../assets/scss/style.scss';
import { ErrorApi } from './api';
import './header.js';
import { StatsManager } from './stats';
import ChartManager from './charts.js';
import { ErrorTable } from './table';
import { getCurrentLang, onLangChange } from './utils/i18n';
import { updateTestErrorButtonVisibility } from './utils/testErrorButton';
import handleModuleLoadError from './utils/moduleLoad';

// Инициализация таблицы ошибок и статистики
window.errorTableInstance = new ErrorTable('server');
// Асинхронная инициализация statsManager после загрузки ошибок
async function initStatsManager() {
  let errors = [];
  try {
    errors = await new ErrorApi().getErrors({});
  } catch (e) {
    console.error('[StatsManager] Error loading errors:', e);
  }
  window.statsManager = new StatsManager(errors);
  window.statsManager.renderErrorCards();
}
initStatsManager();

// Главный класс приложения - инициализирует API, обработчики ошибок и aside
class ErrorLoggerApp {
  constructor(mode = 'server') {
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
          window.aside = new Aside(this);
          if (window.aside && typeof window.aside.translatePage === 'function') {
            window.aside.translatePage(getCurrentLang());
            onLangChange(() => window.aside.translatePage(getCurrentLang()));
          }
        })
        .catch((err) => {
          handleModuleLoadError('Failed to load aside module', err);
        });
      this.setupErrorListeners();
      // Инициализация ChartManager только один раз глобально
      if (!window.chartManager) {
        window.chartManager = new ChartManager();
      }
    });
  }

  async updateErrorTable() {
    if (window.renderErrorTable) {
      this.errorApi.getErrors({}).then((errors) => {
        window.renderErrorTable(errors);
        if (window.statsManager) {
          window.statsManager.errors = errors;
          window.statsManager.renderErrorCards();
        }
        if (window.chartManager) {
          window.chartManager.renderChart();
        }
      });
    }
  }

  // Универсальный обработчик создания ошибки и обновления UI
  handleErrorCreate(errorData) {
    return this.errorApi.createError(errorData).then((created) => {
      this.updateErrorTable();
      return created;
    });
  }

  setupErrorListeners() {
    // Глобальный обработчик ошибок загрузки ресурсов (скрипты, стили, изображения)
    window.addEventListener(
      'error',
      (event) => {
        const target = event.target || event.srcElement;
        if (target && (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement)) {
          const src = target.src || target.href || target.currentSrc || '';
          const tag = target.tagName;
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
    window.onerror = (message, source, lineno, colno, error) => {
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
    window.onunhandledrejection = (event) => {
      console.log('[ErrorLogger] Creating Promise error:', event.reason);
      this.handleErrorCreate({
        type: 'UnhandledPromiseRejection',
        message: event.reason ? String(event.reason) : 'Promise rejected',
        stack: event.reason && event.reason.stack ? event.reason.stack : '',
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
        console.log('[ErrorLogger] Creating Fetch error:', error.message);
        this.handleErrorCreate({
          type: 'FetchError',
          message: error.message,
          source: args[0],
          stack: error.stack,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
        throw error;
      }
    };

    // Дополнительный глобальный обработчик ошибок через addEventListener
    window.addEventListener(
      'error',
      function (event) {
        if (event.error) {
          // Это JS-ошибка (TypeError, SyntaxError и др.)
          if (window.app && window.app.errorApi) {
            window.app.errorApi.createError({
              type: event.error.name || 'Error',
              message: event.error.message || String(event.message),
              source: event.filename,
              lineno: event.lineno,
              colno: event.colno,
              stack: event.error.stack || '',
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
    let errors = [];
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
const defaultMode =
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
