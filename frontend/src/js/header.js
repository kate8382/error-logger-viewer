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

    // Добавляем обработчики сортировки по таблице
    this.addTableSortHandlers();

    // Переключение иконки поиска/выхода
    this.searchOrExitIcon = document.getElementById('searchOrExitIcon');
    this.searchIcon = document.getElementById('searchIcon');
    this.exitIcon = document.getElementById('exitIcon');
    if (this.searchBtn && this.searchInput && this.searchOrExitIcon && this.searchIcon && this.exitIcon) {
      // Клик по exitIcon — сброс фильтра и возврат всех секций
      this.searchBtn.addEventListener('click', () => {
        if (this.exitIcon.style.display !== 'none') {
          this.searchInput.value = '';
          this.filteredErrors = null;
          this.handleSearch('');
          this.searchIcon.style.display = '';
          this.exitIcon.style.display = 'none';
        } else {
          this.handleSearch(this.searchInput.value);
        }
      });
      // Переключение иконки при вводе
      this.searchInput.addEventListener('input', () => {
        const onlyTableVisible = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none').length === 1 && this.sections.table.style.display !== 'none';
        if (this.searchInput.value.trim() || (onlyTableVisible && !this.searchInput.value.trim())) {
          this.searchIcon.style.display = 'none';
          this.exitIcon.style.display = '';
        } else {
          this.searchIcon.style.display = '';
          this.exitIcon.style.display = 'none';
        }
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
          this.searchInput.placeholder = translations[this.lang]?.placeholderTable || 'Search in table...';
          this.searchInput.setAttribute('aria-label', translations[this.lang]?.ariaInputTable || 'Search in table');
        }
        // Показываем всю таблицу (без фильтрации)
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
      // Обычный поиск по таблице, не сбрасываем инпут
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