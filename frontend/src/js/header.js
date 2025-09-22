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
    this.justSwitchedToTable = false;
    this.filteredErrors = null; // Храним отфильтрованные ошибки
    this.init();
  }

  // Универсальный сброс всех секций (показать все)
  showAllSections() {
    Object.values(this.sections).forEach(section => {
      if (section) section.style.display = '';
    });
  }

  // Скрыть все секции кроме указанной
  showOnlySection(key) {
    Object.entries(this.sections).forEach(([k, section]) => {
      if (!section) return;
      section.style.display = k === key ? '' : 'none';
    });
  }

  // Универсальный сброс таблицы, статистики, графика
  resetAllViews() {
    if (this.table && typeof this.table.getErrors === 'function' && typeof this.table.renderErrors === 'function') {
      const allErrors = this.table.getErrors();
      this.table.renderErrors(allErrors);
    }
    if (window.statsManager && typeof window.statsManager.renderErrorCards === 'function') {
      window.statsManager.renderErrorCards();
    }
    if (window.chartManager && typeof window.chartManager.resetToDefault === 'function') {
      window.chartManager.resetToDefault();
    }
  }

  // Универсальная локализация заголовка
  setHeaderTitleBySection(sectionKey = null) {
    if (!sectionKey) {
      this.headerTitle.textContent = translations[this.lang]?.title || 'Error Logger & Viewer';
      return;
    }
    const section = this.sections[sectionKey];
    if (!section) return;
    let titleEl = null;
    if (sectionKey === 'chart') {
      titleEl = section.querySelector('.chart__title');
    } else if (sectionKey === 'stats') {
      titleEl = section.querySelector('.stats__title');
    } else if (sectionKey === 'table') {
      titleEl = section.querySelector('.error-table__title');
    } else {
      titleEl = section.querySelector('h2,h3');
    }
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

  // Универсальная смена плейсхолдера и aria-label
  setSearchPlaceholder(mode = 'default') {
    if (!this.searchInput) return;
    if (mode === 'table') {
      this.searchInput.placeholder = translations[this.lang]?.placeholderTable || 'Search in table...';
      this.searchInput.setAttribute('aria-label', translations[this.lang]?.ariaInputTable || 'Search in table');
    } else {
      this.searchInput.placeholder = translations[this.lang]?.placeholder || 'Search by application...';
      this.searchInput.setAttribute('aria-label', translations[this.lang]?.ariaInput || 'Search errors');
    }
  }

  // Обновление заголовков секций при смене языка
  updateSectionTitles() {
    Object.entries(this.sections).forEach(([key, section]) => {
      if (!section) return;
      let titleEl = null;
      if (key === 'chart') {
        titleEl = section.querySelector('.chart__title');
        // Всегда устанавливаем локализованный заголовок графика
        if (titleEl) {
          titleEl.textContent = translations[this.lang].chartTitle || 'Error Chart';
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

  // Обновление заголовка и плейсхолдера
  updateHeaderUI() {
    const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none');
    let key = null;
    if (visibleSections.length === 1) {
      key = visibleSections[0][0];
    }
    this.setHeaderTitleBySection(key);
    this.setSearchPlaceholder(key === 'table' ? 'table' : 'default');
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

    // Локализация при инициализации
    this.updateSectionTitles();
    // Обработка смены языка
    const langEnBtn = document.getElementById('lang-en');
    const langRuBtn = document.getElementById('lang-ru');
    if (langEnBtn) {
      langEnBtn.addEventListener('click', () => {
        this.lang = 'en';
        this.updateSectionTitles();
        // Определяем режим фильтрации
        const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none');
        let key = null;
        let mode = 'default';
        if (visibleSections.length === 1) {
          key = visibleSections[0][0];
          if (key === 'table') mode = 'table';
        }
        this.setHeaderTitleBySection(key);
        this.setSearchPlaceholder(mode);
      });
    }
    if (langRuBtn) {
      langRuBtn.addEventListener('click', () => {
        this.lang = 'ru';
        this.updateSectionTitles();
        // Определяем режим фильтрации
        const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none');
        let key = null;
        let mode = 'default';
        if (visibleSections.length === 1) {
          key = visibleSections[0][0];
          if (key === 'table') mode = 'table';
        }
        this.setHeaderTitleBySection(key);
        this.setSearchPlaceholder(mode);
      });
    }

    // Фильтрация при вводе
    if (this.searchInput) {
      this.searchInput.addEventListener('input', e => {
        this.handleSearch(e.target.value);
      });

      // Фильтрация по Enter
      this.searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          this.handleSearch(this.searchInput.value);
        }
      });
    }

    // Фильтрация по клику на лупу
    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', () => {
        this.handleSearch(this.searchInput.value);
      });
    }

    // Добавляем обработчики сортировки по таблице
    this.addTableSortHandlers();

    // Переключение иконки поиска/выхода
    this.searchOrExitIcon = document.getElementById('searchOrExitIcon');
    this.searchIcon = document.getElementById('searchIcon');
    this.exitIcon = document.getElementById('exitIcon');
    if (this.searchBtn && this.searchInput && this.searchOrExitIcon && this.searchIcon && this.exitIcon) {
      // Клик по exitIcon — всегда полный выход из фильтрации
      this.searchBtn.addEventListener('click', () => {
        if (this.exitIcon.style.display !== 'none') {
          const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none');
          const onlyTableVisible = visibleSections.length === 1 && this.sections.table.style.display !== 'none';
          const isTableFilterMode = this.searchInput.placeholder === (translations[this.lang]?.placeholderTable || 'Search in table...');

          // 1. Фильтрация по таблице — двухэтапная логика
          if (onlyTableVisible && isTableFilterMode) {
            if (this.searchInput.value) {
              // Первый клик: сброс фильтра таблицы, остаёмся в таблице
              this.searchInput.value = '';
              this.filteredErrors = null;
              this.setSearchPlaceholder('table');
              this.showOnlySection('table');
              this.searchIcon.style.display = '';
              this.exitIcon.style.display = '';
              this.resetAllViews();
            } else {
              // Второй клик: выход на главную
              this.filteredErrors = null;
              this.showAllSections();
              this.setHeaderTitleBySection();
              this.searchIcon.style.display = '';
              this.exitIcon.style.display = 'none';
              this.setSearchPlaceholder('default');
              this.justSwitchedToTable = false;
              this.resetAllViews();
            }
          }
          // 2. Фильтрация по секциям — всегда полный выход
          else if (visibleSections.length === 1) {
            this.searchInput.value = '';
            this.filteredErrors = null;
            this.showAllSections();
            this.setHeaderTitleBySection();
            this.searchIcon.style.display = '';
            this.exitIcon.style.display = 'none';
            this.setSearchPlaceholder('default');
            this.justSwitchedToTable = false;
            this.resetAllViews();
          } else {
            // Если видны несколько секций, используем стандартную логику
            this.handleSearch(this.searchInput.value);
          }
        } else {
          this.handleSearch(this.searchInput.value);
        }
      });
      // Переключение иконки при вводе
      this.searchInput.addEventListener('input', () => {
        const onlyTableVisible = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none').length === 1 && this.sections.table.style.display !== 'none';
        // Показываем крестик если есть текст или только таблица видна
        if (this.searchInput.value.trim() || onlyTableVisible) {
          this.searchIcon.style.display = 'none';
          this.exitIcon.style.display = '';
        } else {
          this.searchIcon.style.display = '';
          this.exitIcon.style.display = 'none';
        }
      });
    }
  }

  // Основная логика поиска и фильтрации
  handleSearch(query) {
    const lowerQuery = query.trim().toLowerCase();
    let anyVisible = false;
    let onlyTableVisible = false;
    // Проверяем, отображается ли только таблица
    const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none');
    if (visibleSections.length === 1 && visibleSections[0][0] === 'table') {
      onlyTableVisible = true;
    }

    if (onlyTableVisible) {
      // Очищаем инпут только при первом переходе к таблице
      if (!this.justSwitchedToTable) {
        if (this.searchInput) {
          this.searchInput.value = '';
          this.setSearchPlaceholder('table');
        }
        this.showOnlySection('table');
        showCenterSpinner(this.sections.table, 'page');
        this.filterTable('').finally(() => {
          hideCenterSpinner(this.sections.table);
        });
        this.justSwitchedToTable = true;
        return;
      }
      // Если уже в таблице, не очищаем value, фильтруем по текущему запросу
      showCenterSpinner(this.sections.table, 'page');
      this.filterTable(query).finally(() => {
        hideCenterSpinner(this.sections.table);
      });
      return;
    } else {
      this.justSwitchedToTable = false;
    }

    // Фильтрация по секциям (по заголовкам)
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

    // Меняем заголовок
    if (!lowerQuery || !anyVisible) {
      this.showAllSections();
      this.setHeaderTitleBySection();
      if (window.chartManager && typeof window.chartManager.resetToDefault === 'function') {
        window.chartManager.resetToDefault();
      }
    } else {
      // Показываем заголовок первой видимой секции
      const firstVisible = Object.values(this.sections).find(sec => sec && sec.style.display !== 'none');
      const key = Object.entries(this.sections).find(([, sec]) => sec === firstVisible)?.[0];
      this.setHeaderTitleBySection(key);
    }

    // 2. Если выбрана таблица — сбрасываем инпут только при переходе к таблице по секционному поиску
    if (this.sections.table && this.sections.table.style.display !== 'none') {
      showCenterSpinner(this.sections.table, 'page');
      this.filterTable(query).finally(() => {
        hideCenterSpinner(this.sections.table);
        if (window.errorTableInstance) {
          window.errorTableInstance.fetchErrors();
        }
      });
    }
    // В самом конце handleSearch гарантируем смену плейсхолдера после всех асинхронных операций
    if (this.searchInput) {
      this.setSearchPlaceholder(onlyTableVisible ? 'table' : 'default');
    }
  }

  async filterTable(query) {
    // Получаем все ошибки
    const errors = await this.api.getErrors({});
    const lang = this.lang || getCurrentLang();
    const filtered = errors.filter(error => {
      // Локализованные значения типа и статуса
      const typeKey = 'errorType_' + error.type;
      const typeText = this.table.translations[lang][typeKey] || error.type;
      const statusText = this.table.translations[lang][error.status || 'new'] || (error.status || 'new');

      // Только дата (без времени)
      const getDateOnly = str => {
        if (!str) return '';
        const date = new Date(str);
        return date.toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      const firstSeenDate = getDateOnly(error.firstSeen);
      const lastSeenDate = getDateOnly(error.lastSeen);
      // Сравниваем по строке и по числу
      return [
        error.id,
        typeText,
        statusText,
        firstSeenDate,
        lastSeenDate
      ].some(val => val && String(val).toLowerCase().includes(query.toLowerCase()));
    });
    this.filteredErrors = filtered.length < errors.length ? filtered : null;
    this.table.renderErrors(filtered);
  }

  addTableSortHandlers() {
    // Кнопки сортировки должны иметь id: sortById, sortByType, sortByCount, sortByFirstSeen, sortByLastSeen, sortByStatus
    const sortFields = [
      { id: 'sortById', field: 'id' },
      { id: 'sortByType', field: 'type' },
      { id: 'sortByCount', field: 'count' },
      { id: 'sortByFirstSeen', field: 'firstSeen' },
      { id: 'sortByLastSeen', field: 'lastSeen' },
      { id: 'sortByStatus', field: 'status' }
    ];
    this.sortOrder = {
      id: 'asc',
      type: 'asc',
      count: 'asc',
      firstSeen: 'asc',
      lastSeen: 'asc',
      status: 'asc'
    };
    sortFields.forEach(({ id, field }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', e => {
          e.preventDefault();
          this.handleTableSort(field);
        });
      }
    });
  }

  handleTableSort(field) {
    // Если есть фильтр — сортируем только по отфильтрованным данным
    let errorsToSort = this.filteredErrors || this.table.getErrors();
    // Если массив пустой — запрашиваем все ошибки
    if (!errorsToSort || !errorsToSort.length) {
      errorsToSort = this.table.getErrors();
    }
    const sorted = this.table.sortErrors([...errorsToSort], field, this.sortOrder[field]);
    this.table.renderErrors(sorted);
    // Переключаем направление для следующего клика
    this.sortOrder[field] = this.sortOrder[field] === 'asc' ? 'desc' : 'asc';
    // Обновляем filteredErrors, чтобы сортировка была по текущему фильтру
    if (this.filteredErrors) {
      this.filteredErrors = sorted;
    }
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  window.headerManager = new HeaderManager();
});