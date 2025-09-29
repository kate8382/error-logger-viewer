import '../assets/scss/style.scss';
import { ErrorApi } from './api';
import './header.js';
import { StatsManager } from './stats';
import ChartManager from './charts.js';
import { ErrorTable } from './table';
import { t, getCurrentLang, onLangChange } from './utils/i18n.js';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading.js';

// Инициализация таблицы ошибок и статистики
window.errorTableInstance = new ErrorTable();
// Асинхронная инициализация statsManager после загрузки ошибок
async function initStatsManager() {
  let errors = [];
  try {
    errors = await (new ErrorApi()).getErrors({});
  } catch (e) {
    console.error('[StatsManager] Ошибка загрузки ошибок:', e);
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
      import('./aside').then(({ Aside }) => { // Динамический импорт (lazy loading) для отложенной загрузки aside
        window.aside = new Aside(this);
        if (window.aside && typeof window.aside.translatePage === 'function') {
          window.aside.translatePage(getCurrentLang());
          onLangChange(() => window.aside.translatePage(getCurrentLang()));
        }
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
      this.errorApi.getErrors({}).then(errors => window.renderErrorTable(errors));
    }
  }

  setupErrorListeners() {
    // Глобальный обработчик ошибок загрузки ресурсов (скрипты, стили, изображения)
    window.addEventListener('error', (event) => {
      const target = event.target || event.srcElement;
      if (target && (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement)) {
        const src = target.src || target.href || target.currentSrc || '';
        const tag = target.tagName;
        this.errorApi.createError({
          type: 'ResourceLoadError',
          message: `Failed to load resource: ${tag}`,
          source: src,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }).then((created) => {
          if (created && created.id) {
            this.updateErrorTable();
          } else {
            setTimeout(() => this.updateErrorTable(), 500);
          }
        });
      }
    }, true);
    // Глобальный обработчик ошибок JavaScript (onerror: message - ошибка в коде, source - файл, lineno - строка, colno - столбец)
    window.onerror = (message, source, lineno, colno, error) => {
      console.log('[ErrorLogger] Creating JS error:', message);
      this.errorApi.createError({
        type: error && error.name ? error.name : 'Error',
        message: String(message),
        source: String(source),
        lineno,
        colno,
        stack: error && error.stack ? error.stack : '',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      }).then((created) => {
        if (created && created.id) {
          this.updateErrorTable();
        } else {
          setTimeout(() => this.updateErrorTable(), 500);
        }
      });
    };
    // Глобальный обработчик необработанных промиссов (unhandledrejection)
    window.onunhandledrejection = (event) => {
      console.log('[ErrorLogger] Creating Promise error:', event.reason);
      this.errorApi.createError({
        type: 'UnhandledPromiseRejection',
        message: event.reason ? String(event.reason) : 'Promise rejected',
        stack: event.reason && event.reason.stack ? event.reason.stack : '',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      }).then((created) => {
        if (created && created.id) {
          this.updateErrorTable();
        } else {
          setTimeout(() => this.updateErrorTable(), 500);
        }
      });
    };

    const origFetch = window.fetch;
    // Переопределение fetch для логирования ошибок
    window.fetch = async (...args) => {
      try {
        const response = await origFetch(...args);
        if (!response.ok) {
          console.log('[ErrorLogger] Creating Fetch error:', response.status, response.statusText);
          this.errorApi.createError({
            type: 'FetchError',
            message: `Fetch failed: ${response.status} ${response.statusText}`,
            source: args[0],
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          }).then((created) => {
            if (created && created.id) {
              this.updateErrorTable();
            } else {
              setTimeout(() => this.updateErrorTable(), 500);
            }
          });
        }
        return response;
      } catch (error) {
        console.log('[ErrorLogger] Creating Fetch error:', error.message);
        this.errorApi.createError({
          type: 'FetchError',
          message: error.message,
          source: args[0],
          stack: error.stack,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }).then((created) => {
          if (created && created.id) {
            this.updateErrorTable();
          } else {
            setTimeout(() => this.updateErrorTable(), 500);
          }
        });
        throw error;
      }
    };

    // Дополнительный глобальный обработчик ошибок через addEventListener
    window.addEventListener('error', function (event) {
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
            lastSeen: new Date().toISOString()
          });
        }
      }
    }, true);
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
const app = new ErrorLoggerApp('server');
window.app = app;
app.flushLocalErrors();

// Кнопка для тестовой генерации ошибки (для отладки)
function createTestErrorButton() {
  const btn = document.createElement('button');
  const setBtnText = () => { btn.textContent = t('createTestErrorBtn') || 'Создать тестовую ошибку'; };
  setBtnText();
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = 10000;
  btn.style.background = '#a0a0ff';
  btn.style.color = '#222';
  btn.style.padding = '10px 20px';
  btn.style.borderRadius = '8px';
  btn.style.border = 'none';
  btn.style.cursor = 'pointer';
  btn.onclick = async () => {
    const { ErrorApi } = await import('./api.js');
    const api = new ErrorApi();
    await api.createError({
      type: 'TestError',
      message: t('testErrorMsg') || 'Тестовая ошибка для проверки дат',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });
    alert(t('testErrorCreated') || 'Тестовая ошибка создана! Обновите таблицу.');
  };
  document.body.appendChild(btn);
  onLangChange(setBtnText);
}
document.addEventListener('DOMContentLoaded', createTestErrorButton);