import type { Mode } from './api';
import { ErrorApi } from './api';
import { t, getCurrentLang, setLang, onLangChange } from './utils/i18n';
import { qsa, qs } from './utils/dom';

export class Aside {
  api: ErrorApi;
  lang: 'en' | 'ru';
  // eslint-disable-next-line no-unused-vars
  _aboutEscHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.api = new ErrorApi();
    this.lang = getCurrentLang();
    // Установить тему при инициализации (из localStorage или по умолчанию)
    // По умолчанию всегда светлая тема, если не сохранено явно
    let savedTheme = localStorage.getItem('theme');
    if (savedTheme !== 'dark') savedTheme = 'light';
    this.setTheme(savedTheme);
    this.initControls();
    this.initDropdowns();
    this.initHashHandler();
    // Показать about при загрузке, если #about
    if (location.hash === '#about') {
      this.showAboutSection(this.lang);
    }
  }

  // Показывает About-секцию и скрывает остальные main > section
  showAboutSection(lang: 'en' | 'ru' = this.lang) {
    qsa<HTMLElement>('main > section').forEach((sec) => {
      sec.style.display = 'none';
    });
    const aboutSection = qs<HTMLElement>('#aboutSection');
    if (aboutSection) {
      const aboutKey = lang === 'ru' ? 'aboutText_ru' : 'aboutText_en';
      aboutSection.innerHTML = t(aboutKey) || '';
      aboutSection.style.display = '';

      // Обработчик для кнопки-крестика
      const closeBtn = qs<HTMLElement>('.about-btn-close', aboutSection);
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          location.hash = '';
        });
      }

      // Обработчик для Esc
      this._aboutEscHandler = (e) => {
        if (e.key === 'Escape') {
          location.hash = '';
        }
      };
      document.addEventListener('keydown', this._aboutEscHandler);
    } else {
      // Показать все основные секции приложения
      qsa<HTMLElement>('main > section').forEach((sec) => {
        if (sec.id !== 'aboutSection') sec.style.display = '';
      });
    }
  }

  // Обработчик смены hash для показа About
  initHashHandler() {
    window.addEventListener('hashchange', () => {
      if (location.hash === '#about') {
        this.showAboutSection(this.lang);
      } else {
        // Скрыть aboutSection при переходе на другие разделы
        const aboutSection = qs<HTMLElement>('#aboutSection');
        if (aboutSection) aboutSection.style.display = 'none';
        // Удалить обработчик Esc, если был добавлен
        if (this._aboutEscHandler) {
          document.removeEventListener('keydown', this._aboutEscHandler);
          this._aboutEscHandler = null;
        }
        // Показать все основные секции приложения
        qsa<HTMLElement>('main > section').forEach((sec) => {
          if (sec.id !== 'aboutSection') sec.style.display = '';
        });
      }
    });
  }

  initControls() {
    // Смена режима работы (сервер/демо)
    const modeOptions = qsa<HTMLElement>('.sidebar__dropdown-sublist[data-group="mode"] .sidebar__dropdown-option');
    modeOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const mode = option.dataset.value as Mode;
        const app = (window as Window & { app?: { errorApi?: ErrorApi, updateErrorTable?: () => void, lang?: string } }).app;
        if (app && app.errorApi && typeof app.updateErrorTable === 'function') {
          app.errorApi.setMode(mode);
          // eslint-disable-next-line no-unused-vars
          const et = (window as Window & { errorTableInstance?: { setMode?: (mode: Mode) => void } }).errorTableInstance;
          if (et && typeof et.setMode === 'function') {
            et.setMode(mode);
          }
          app.updateErrorTable();
          // Триггерим кастомное событие для обновления UI (например, кнопки тестовой ошибки)
          window.dispatchEvent(new CustomEvent('modeChanged'));
        }
      });
    });

    // Смена темы
    const themeOptions = qsa<HTMLElement>('.sidebar__dropdown-sublist[data-group="theme"] .sidebar__dropdown-option');
    themeOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const theme = option.dataset.value as string;
        this.setTheme(theme);
      });
    });

    // Смена языка — обработчики только в header.js, здесь только реакция на смену
    onLangChange((lang: 'en' | 'ru') => {
      this.lang = lang;
      this.translatePage();
      if (location.hash === '#about') {
        this.showAboutSection(lang);
      }
    });

    // Смена языка через выпадающий список
    const langOptions = qsa<HTMLElement>('.sidebar__dropdown-sublist[data-group="language"] .sidebar__dropdown-option');
    langOptions.forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = (btn.dataset.value as 'en' | 'ru') || 'en';
        setLang(lang);
      });
    });
  }

  // Инициализация выпадающих списков и подгрупп
  initDropdowns() {
    // Открытие/закрытие основного списка настроек
    const dropdown = qs<HTMLElement>('.sidebar__dropdown');
    const dropdownBtn = dropdown ? qs<HTMLElement>('.sidebar__dropdown-btn', dropdown) : null;
    if (dropdown && dropdownBtn) {
      dropdownBtn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      // Закрытие при клике вне меню
      document.addEventListener('click', (e: Event) => {
        if (!dropdown.contains(e.target as Node)) {
          dropdown.classList.remove('open');
        }
      });
    }

    // Открытие/закрытие подгрупп настроек
    const groupBtns = qsa<HTMLElement>('.sidebar__dropdown-group-btn');
    groupBtns.forEach((btn) => {
      const group = btn.closest('.sidebar__dropdown-group') as HTMLElement | null;
      btn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        if (group) {
          group.classList.toggle('open');
        }
      });
    });
    // Закрытие подгрупп при клике вне
    document.addEventListener('click', (e: Event) => {
      groupBtns.forEach((btn) => {
        const group = btn.closest('.sidebar__dropdown-group') as HTMLElement | null;
        if (group && !group.contains(e.target as Node)) {
          group.classList.remove('open');
        }
      });
    });
  }

  setTheme(theme: string) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
    // Обновить активное состояние кнопок темы (если есть)
    const themeOptions = qsa<HTMLElement>('.sidebar__dropdown-sublist[data-group="theme"] .sidebar__dropdown-option');
    themeOptions.forEach((option) => {
      if (option.dataset.value === theme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }

  translatePage() {
    const sidebarTexts = qsa<HTMLElement>('.sidebar__item-text[data-i18n]');
    sidebarTexts.forEach((element) => {
      const key = element.getAttribute('data-i18n') || '';
      let replaced = false;
      element.childNodes.forEach((node) => {
        if (!replaced && node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim() !== '') {
          node.textContent = t(key) || key;
          replaced = true;
        }
      });
      if (!replaced) {
        element.textContent = t(key) || key;
      }
    });

    const dropdownBtns = qsa<HTMLElement>('.sidebar__dropdown-btn[data-i18n]');
    dropdownBtns.forEach((btn) => {
      const key = btn.getAttribute('data-i18n') || '';
      const textEl = btn.querySelector<HTMLElement>('.sidebar__item-text');
      if (textEl) {
        textEl.textContent = t(key) || key;
      }
    });

    const dropdownOptions = qsa<HTMLElement>('.sidebar__dropdown-option[data-i18n]');
    dropdownOptions.forEach((el) => {
      const key = el.getAttribute('data-i18n') || '';
      let replaced = false;
      el.childNodes.forEach((node) => {
        if (!replaced && node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim() !== '') {
          node.textContent = t(key) || key;
          replaced = true;
        }
      });
      if (!replaced) {
        el.textContent = t(key) || key;
      }
    });

    const groupTexts = qsa<HTMLElement>('.sidebar__dropdown-group-text[data-i18n]');
    groupTexts.forEach((span) => {
      const key = span.getAttribute('data-i18n') || '';
      span.textContent = t(key) || key;
    });

    const dropdownElements = qsa<HTMLElement>('.sidebar__dropdown [data-i18n]:not(.sidebar__dropdown-btn):not(.sidebar__dropdown-option):not(.sidebar__dropdown-group-text)');
    dropdownElements.forEach((el) => {
      const key = el.getAttribute('data-i18n') || '';
      let replaced = false;
      el.childNodes.forEach((node) => {
        if (!replaced && node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim() !== '') {
          node.textContent = t(key) || key;
          replaced = true;
        }
      });
      if (!replaced) {
        el.textContent = t(key) || key;
      }
    });

    const otherElements = qsa<HTMLElement>('[data-i18n]').filter((el) => !el.classList.contains('sidebar__item-text') && !el.closest('.sidebar__dropdown'));
    otherElements.forEach((element) => {
      const key = element.getAttribute('data-i18n') || '';
      const span = element.querySelector<HTMLElement>('span');
      if (span) {
        span.textContent = t(key) || key;
      } else {
        element.textContent = t(key) || key;
      }
    });

    const placeholders = qsa<HTMLElement>('[data-i18n-placeholder]');
    placeholders.forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder') || '';
      element.setAttribute('placeholder', t(key) || key);
    });

    const ariaElements = qsa<HTMLElement>('[data-i18n-aria-label]');
    ariaElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label') || '';
      el.setAttribute('aria-label', t(key));
    });
  }
}
