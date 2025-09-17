import { ErrorApi } from './api';
import { ErrorTable } from './table';
import { StatsManager } from './stats';
import { translations } from './utils/i18n';
import { getCurrentLang } from './utils/lang';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading';

export class HeaderManager {
  constructor() {
    this.api = new ErrorApi();
    this.table = window.errorTableInstance || new ErrorTable();
    this.stats = window.statsManager || new StatsManager();
    this.chart = window.chartManager;
    this.lang = getCurrentLang();
    console.log('[HeaderManager] Инициализация конструктора');
    this.init();
  }

  updateSectionTitles() {
    Object.entries(this.sections).forEach(([key, section]) => {
      if (!section) return;
      let titleEl = null;
      if (key === 'chart') {
        titleEl = section.querySelector('.chart__title');
        // Всегда устанавливаем локализованный заголовок графика
        if (titleEl) {
          titleEl.textContent = translations[this.lang].chartTitle || 'График ошибок';
        }
        return;
      }
      if (key === 'stats') {
        titleEl = section.querySelector('.stats__title');
      } else if (key === 'table') {
        titleEl = section.querySelector('.error-table__title');
      } else {
        titleEl = section.querySelector('h2,h3');
      }
      if (titleEl) {
        const i18nKey = titleEl.getAttribute('data-i18n');
        if (i18nKey && translations[this.lang][i18nKey]) {
          titleEl.textContent = translations[this.lang][i18nKey];
        }
      }
    });
  }

  init() {
    this.searchInput = document.getElementById('searchInput');
    this.headerTitle = document.querySelector('.header__title');
    this.searchBtn = document.getElementById('searchBtn');
    this.sections = {
      stats: document.getElementById('errorStats'),
      chart: document.getElementById('errorsChart'),
      table: document.getElementById('errorTableSection')
    };

    console.log('[HeaderManager] Элементы:', {
      searchInput: this.searchInput,
      headerTitle: this.headerTitle,
      searchBtn: this.searchBtn,
      sections: this.sections
    });

    // Локализация при инициализации
    this.localizeHeader();
    this.updateSectionTitles();
    // Обработка смены языка
    const langEnBtn = document.getElementById('lang-en');
    const langRuBtn = document.getElementById('lang-ru');
    if (langEnBtn) {
      langEnBtn.addEventListener('click', () => {
        this.lang = 'en';
        this.localizeHeader();
        this.updateSectionTitles();
      });
    }
    if (langRuBtn) {
      langRuBtn.addEventListener('click', () => {
        this.lang = 'ru';
        this.localizeHeader();
        this.updateSectionTitles();
      });
    }

    // Фильтрация при вводе
    if (this.searchInput) {
      this.searchInput.addEventListener('input', e => {
        console.log('[HeaderManager] input event', e.target.value);
        this.handleSearch(e.target.value);
      });

      // Фильтрация по Enter
      this.searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          console.log('[HeaderManager] keydown Enter', this.searchInput.value);
          this.handleSearch(this.searchInput.value);
        }
      });
    }

    // Фильтрация по клику на лупу
    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', () => {
        console.log('[HeaderManager] click event', this.searchInput.value);
        this.handleSearch(this.searchInput.value);
      });
    }
  }

  localizeHeader() {
    // Локализуем только заголовок
    if (this.headerTitle) {
      this.headerTitle.textContent = translations[this.lang]?.title || 'Error Logger & Viewer';
    }
  }

  handleSearch(query) {
    // 1. Фильтрация по секциям (по заголовкам)
    const lowerQuery = query.trim().toLowerCase();
    let anyVisible = false;
    let onlyTableVisible = false;
    Object.entries(this.sections).forEach(([key, section]) => {
      if (!section) return;
      let titleEl = null;
      if (key === 'chart') {
        titleEl = section.querySelector('.chart__title');
      } else if (key === 'stats') {
        titleEl = section.querySelector('.stats__title');
      } else if (key === 'table') {
        titleEl = section.querySelector('.error-table__title');
      } else {
        titleEl = section.querySelector('h2,h3');
      }
      let localizedText = '';
      if (titleEl) {
        const i18nKey = titleEl.getAttribute('data-i18n');
        if (i18nKey && translations[this.lang][i18nKey]) {
          localizedText = translations[this.lang][i18nKey].toLowerCase();
        } else {
          localizedText = titleEl.textContent?.toLowerCase() || '';
        }
      }
      if (!lowerQuery || localizedText.includes(lowerQuery)) {
        section.style.display = '';
        anyVisible = true;
      } else {
        section.style.display = 'none';
      }
    });

    // Проверяем, отображается ли только таблица
    const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none');
    if (visibleSections.length === 1 && visibleSections[0][0] === 'table') {
      // Автоматически очищаем инпут, если фильтрация по секциям оставила только таблицу
      if (this.searchInput && this.searchInput.value !== '') {
        this.searchInput.value = '';
      }
      onlyTableVisible = true;
    }

    // Меняем заголовок
    if (!lowerQuery || !anyVisible) {
      // Если инпут пустой (ручная очистка), показываем все секции
      Object.entries(this.sections).forEach(([_, section]) => {
        if (!section) return;
        section.style.display = '';
      });
      this.headerTitle.textContent = translations[this.lang]?.title || 'Error Logger & Viewer';
    } else {
      // Показываем заголовок первой видимой секции
      const firstVisible = Object.values(this.sections).find(sec => sec && sec.style.display !== 'none');
      const titleEl = firstVisible?.querySelector('h2,h3');
      if (titleEl) {
        const i18nKey = titleEl.getAttribute('data-i18n');
        if (i18nKey && translations[this.lang][i18nKey]) {
          this.headerTitle.textContent = translations[this.lang][i18nKey];
        } else {
          this.headerTitle.textContent = titleEl.textContent || translations[this.lang]?.title || 'Error Logger & Viewer';
        }
      } else {
        this.headerTitle.textContent = translations[this.lang]?.title || 'Error Logger & Viewer';
      }
    }

    // 2. Если выбрана таблица — сбрасываем инпут только при переходе к таблице по секционному поиску
    if (this.sections.table && this.sections.table.style.display !== 'none') {
      if (onlyTableVisible) {
        if (this.searchInput) {
          this.searchInput.value = '';
        }
        // Показываем спиннер на таблице
        showCenterSpinner(this.sections.table, 'page');
        this.filterTable('').finally(() => {
          hideCenterSpinner(this.sections.table);
          if (window.errorTableInstance) {
            window.errorTableInstance.fetchErrors();
          }
        });
      } else {
        // Обычный поиск по таблице, не сбрасываем инпут
        showCenterSpinner(this.sections.table, 'page');
        this.filterTable(query).finally(() => {
          hideCenterSpinner(this.sections.table);
          if (window.errorTableInstance) {
            window.errorTableInstance.fetchErrors();
          }
        });
      }
    }
    // В самом конце handleSearch гарантируем смену плейсхолдера после всех асинхронных операций
    if (this.searchInput) {
      if (onlyTableVisible) {
        this.searchInput.placeholder = translations[this.lang]?.placeholderTable || 'Search in table...';
        this.searchInput.setAttribute('aria-label', translations[this.lang]?.ariaInputTable || 'Search in table');
      } else {
        this.searchInput.placeholder = translations[this.lang]?.placeholder || 'Search by application...';
        this.searchInput.setAttribute('aria-label', translations[this.lang]?.ariaInput || 'Search errors');
      }
    }
  }

  async filterTable(query) {
    // Получаем все ошибки
    const errors = await this.api.getErrors({});
    const filtered = errors.filter(error => {
      // Фильтрация по id, типу, статусу, датам, count
      return [
        error.id,
        error.type,
        error.status,
        error.firstSeen,
        error.lastSeen,
        error.count
      ].some(val => val && String(val).toLowerCase().includes(query.toLowerCase()));
    });
    this.table.renderErrors(filtered);
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  new HeaderManager();
});