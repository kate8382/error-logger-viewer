// Кнопка для тестовой генерации ошибки (для отладки)
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.textContent = 'Создать тестовую ошибку';
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
      message: 'Тестовая ошибка для проверки дат',
      timestamp: new Date().toISOString()
    });
    alert('Тестовая ошибка создана! Обновите таблицу.');
  };
  document.body.appendChild(btn);
});

import '../assets/scss/style.scss';
import { translations } from './utils/i18n';
import { getCurrentLang } from './utils/lang';
import { ErrorApi } from './api';
import { initErrorsChart } from './stats';
import { ErrorTable } from './table';

// Главный класс приложения - инициализирует API, обработчики ошибок и aside
class ErrorLoggerApp {
  constructor(mode = 'server') {
    this.lang = getCurrentLang();
    this.errorApi = new ErrorApi(mode);
    this.translations = translations;
    this.init();
  }

  // Инициализация приложения
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      import('./aside').then(({ Aside }) => { // Динамический импорт (lazy loading) для отложенной загрузки aside
        window.aside = new Aside(this);
        window.aside.translatePage(this.lang);
      });
      this.setupErrorListeners();
    });
  }

  async updateErrorTable() {
    if (window.renderErrorTable) {
      this.errorApi.getErrors().then(errors => window.renderErrorTable(errors));
    }
  }

  setupErrorListeners() {
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
        timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
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
            timestamp: new Date().toISOString()
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
          timestamp: new Date().toISOString()
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
  }

  // Получаем ошибки из localStorage
  async flushLocalErrors() {
    const key = 'pendingErrors';
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

const app = new ErrorLoggerApp('server');
window.app = app;
// ...existing code...