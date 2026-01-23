import type { Mode } from './api';
import { ErrorApi } from './api';
import type { ErrorTable } from './table';
import { t, getCurrentLang, setLang, onLangChange } from './utils/i18n';
import { qsa, qs, translateNodes, delegate } from './utils/dom';

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
        // Локальное приведение глобального `app` к минимальному типу для обращения к errorApi/updateErrorTable
        // eslint-disable-next-line no-unused-vars
        const app = window.app as unknown as { errorApi?: { setMode?: (m: Mode) => void }, updateErrorTable?: () => void } | undefined;
        if (app && app.errorApi && typeof app.updateErrorTable === 'function') {
          if (typeof app.errorApi.setMode === 'function') app.errorApi.setMode(mode);
          /* Приведение глобального инстанса таблицы к реальному типу ErrorTable. Это нужно для безопасного вызова метода `setMode`, т.к. `window.errorTableInstance` объявлен минимально в global.d.ts */
          const et = window.errorTableInstance as unknown as ErrorTable | undefined;
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

    // Смена языка через выпадающий список (делегируем на document)
    delegate(document, '.sidebar__dropdown-sublist[data-group="language"] .sidebar__dropdown-option', 'click', (_ev, btn) => {
      const el = btn as HTMLElement;
      const lang = (el.dataset.value as 'en' | 'ru') || 'en';
      setLang(lang);
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
    translateNodes(document, '.sidebar__item-text[data-i18n]');
    // dropdown btns keep their inner .sidebar__item-text element
    const dropdownBtns = qsa<HTMLElement>('.sidebar__dropdown-btn[data-i18n]');
    dropdownBtns.forEach((btn) => {
      const key = btn.getAttribute('data-i18n') || '';
      const textEl = btn.querySelector<HTMLElement>('.sidebar__item-text');
      if (textEl) {
        textEl.textContent = t(key) || key;
      }
    });
    translateNodes(document, '.sidebar__dropdown-option[data-i18n]');
    translateNodes(document, '.sidebar__dropdown-group-text[data-i18n]');
    translateNodes(document, '.sidebar__dropdown [data-i18n]:not(.sidebar__dropdown-btn):not(.sidebar__dropdown-option):not(.sidebar__dropdown-group-text)');

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
