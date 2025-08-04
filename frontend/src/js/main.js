import '../assets/scss/style.scss';
import { translations } from './i18n';
import { ErrorApi } from './api';
import { initErrorsChart } from './stats';

// Главный класс приложения
// Инициализирует API, перевод страницы и обработчики событий
class ErrorLoggerApp {
  constructor(mode = 'server') {
    this.lang = (navigator.language || navigator.userLanguage).startsWith('ru') ? 'ru' : 'en';
    this.errorApi = new ErrorApi(mode);
    this.translations = translations;
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.translatePage(this.lang);
      this.setupLangSwitch();
      this.setupDropdown();
    });
  }

  setupLangSwitch() {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const selectedLang = button.id === 'lang-en' ? 'en' : 'ru';
        this.lang = selectedLang;
        this.translatePage(selectedLang);
      });
    });
  }

  setupDropdown() {
    const dropdown = document.getElementById('sidebarDropdown');
    if (!dropdown) return;
    const dropdownBtn = dropdown.querySelector('.sidebar__dropdown-btn');
    const groupBtns = dropdown.querySelectorAll('.sidebar__dropdown-group-btn');
    const options = dropdown.querySelectorAll('.sidebar__dropdown-option');

    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
      dropdown.querySelectorAll('.sidebar__dropdown-group').forEach(g => g.classList.remove('open'));
    });

    groupBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const group = btn.closest('.sidebar__dropdown-group');
        dropdown.querySelectorAll('.sidebar__dropdown-group').forEach(g => {
          if (g !== group) g.classList.remove('open');
        });
        group.classList.toggle('open');
      });
    });

    options.forEach(option => {
      const sublist = option.closest('.sidebar__dropdown-sublist');
      if (sublist) {
        // Переключение режима
        if (sublist.dataset.group === 'mode') {
          option.addEventListener('click', () => {
            const mode = option.dataset.value;
            if (mode === 'server' || mode === 'demo') {
              this.errorApi.setMode(mode);
              this.updateErrorTable(); // обновить таблицу после смены режима
            }
          });
        }
        // Переключение темы
        if (sublist.dataset.group === 'theme') {
          option.addEventListener('click', () => {
            const theme = option.dataset.value;
            this.setTheme(theme);
          });
        }
      }
    });
  }

  updateErrorTable() {
    // Здесь должен быть вызов функции рендера таблицы, например:
    // renderErrorTable(await this.errorApi.getErrors());
    // Пока просто заглушка:
    if (window.renderErrorTable) {
      this.errorApi.getErrors().then(errors => window.renderErrorTable(errors));
    }
  }

  setTheme(theme) {
    // theme: 'light' или 'dark'
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  translatePage(lang) {
    const translations = this.translations;
    const currentLang = lang || this.lang;
    const sidebarTexts = document.querySelectorAll('.sidebar__item-text[data-i18n]');
    sidebarTexts.forEach((element) => {
      const key = element.getAttribute('data-i18n');
      let replaced = false;
      element.childNodes.forEach(node => {
        if (!replaced && node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
          node.textContent = translations[currentLang][key] || key;
          replaced = true;
        }
      });
      if (!replaced) {
        element.textContent = translations[currentLang][key] || key;
      }
    });

    const dropdownBtns = document.querySelectorAll('.sidebar__dropdown-btn[data-i18n]');
    dropdownBtns.forEach((btn) => {
      const key = btn.getAttribute('data-i18n');
      const textEl = btn.querySelector('.sidebar__item-text');
      if (textEl) {
        textEl.textContent = translations[currentLang][key] || key;
      }
    });

    const dropdownOptions = document.querySelectorAll('.sidebar__dropdown-option[data-i18n]');
    dropdownOptions.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      let replaced = false;
      el.childNodes.forEach(node => {
        if (!replaced && node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
          node.textContent = translations[currentLang][key] || key;
          replaced = true;
        }
      });
      if (!replaced) {
        el.textContent = translations[currentLang][key] || key;
      }
    });

    const groupTexts = document.querySelectorAll('.sidebar__dropdown-group-text[data-i18n]');
    groupTexts.forEach((span) => {
      const key = span.getAttribute('data-i18n');
      span.textContent = translations[currentLang][key] || key;
    });

    const dropdownElements = document.querySelectorAll('.sidebar__dropdown [data-i18n]:not(.sidebar__dropdown-btn):not(.sidebar__dropdown-option):not(.sidebar__dropdown-group-text)');
    dropdownElements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      let replaced = false;
      el.childNodes.forEach(node => {
        if (!replaced && node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
          node.textContent = translations[currentLang][key] || key;
          replaced = true;
        }
      });
      if (!replaced) {
        el.textContent = translations[currentLang][key] || key;
      }
    });

    const otherElements = Array.from(document.querySelectorAll('[data-i18n]')).filter(
      el => !el.classList.contains('sidebar__item-text') && !el.closest('.sidebar__dropdown')
    );
    otherElements.forEach((element) => {
      const key = element.getAttribute('data-i18n');
      const span = element.querySelector('span');
      if (span) {
        span.textContent = translations[currentLang][key] || key;
      } else {
        element.textContent = translations[currentLang][key] || key;
      }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.setAttribute('placeholder', translations[currentLang][key] || key);
    });

    const ariaElements = document.querySelectorAll('[data-i18n-aria-label]');
    ariaElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      el.setAttribute('aria-label', translations[currentLang][key] || key);
    });
  }

  setupErrorListeners() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.errorApi.createError({
        type: error && error.name ? error.name : 'Error',
        message: String(message),
        source: String(source),
        lineno,
        colno,
        stack: error && error.stack ? error.stack : '',
        timestamp: new Date().toISOString()
      });
    };
    window.onunhandledrejection = (event) => {
      this.errorApi.createError({
        type: 'UnhandledPromiseRejection',
        message: event.reason ? String(event.reason) : 'Promise rejected',
        stack: event.reason && event.reason.stack ? event.reason.stack : '',
        timestamp: new Date().toISOString()
      });
    };
  }
}

// Инициализация приложения вне класса
const app = new ErrorLoggerApp('server'); // или 'demo'
window.app = app;