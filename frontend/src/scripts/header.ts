import { ErrorApi } from './api';
import { ErrorTable } from './table';
import { StatsManager } from './stats';
import type { ErrorItem } from './types/errors';
import { filterErrors } from './services/errorFilter';
import { qs, createElement, delegate, translateNodes } from './utils/dom';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading';
import { t, getCurrentLang, getLabel, setLang, onLangChange } from './utils/i18n';

export class HeaderManager {
  api: ErrorApi;
  table: ErrorTable; // Экземпляр ErrorTable (из `window`)
  stats: StatsManager; // Экземпляр StatsManager (из `window`)
  chart: ChartManagerInterface | undefined; // Экземпляр ChartManager (из `window`)
  lang: string;
  justSwitchedToTable: boolean;
  filteredErrors: ErrorItem[] | null;
  _debounceTimers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};
  _lastFilterRequestId = 0;

  searchInput: HTMLInputElement | null = null;
  headerTitle: HTMLElement | null = null;
  searchBtn: HTMLElement | null = null;
  sections: Record<string, HTMLElement | null> = { stats: null, chart: null, table: null };
  searchOrExitIcon: HTMLElement | null = null;
  searchIcon: HTMLElement | null = null;
  exitIcon: HTMLElement | null = null;
  sortOrder: Record<string, string> = {};

  constructor() {
    this.api = new ErrorApi();
    this.table = (window.errorTableInstance as unknown as ErrorTable) || new ErrorTable();
    this.stats = (window.statsManager as unknown as StatsManager) || new StatsManager();
    this.chart = window.chartManager;
    this.lang = getCurrentLang();
    this.justSwitchedToTable = false;
    this.filteredErrors = null;
    this.init();
  }

  // Универсальный сброс всех секций (показать все)
  showAllSections() {
    Object.values(this.sections).forEach((section) => {
      if (section) section.style.display = '';
    });
  }

  // Скрыть все секции кроме указанной
  showOnlySection(key: string) {
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
  setHeaderTitleBySection(sectionKey: string | null = null) {
    if (!this.headerTitle) return;
    // Если sectionKey не передан или все секции видимы — основной заголовок
    if (!sectionKey) {
      const titleSpan = this.headerTitle.querySelector('.header__title-text[data-i18n="title"]') || this.headerTitle.querySelector('[data-i18n="title"]');
      if (titleSpan) {
        titleSpan.textContent = t('title') || 'Error Logger & Viewer';
      } else {
        const existingAnchor = this.headerTitle.querySelector('a');
        const span = createElement('span', { className: 'header__title-text', attrs: { 'data-i18n': 'title' }, text: t('title') || 'Error Logger & Viewer' });
        if (existingAnchor) existingAnchor.appendChild(span);
        else {
          const a = createElement('a', { attrs: { href: 'https://github.com/kate8382/error-logger-viewer', target: '_blank', rel: 'noopener noreferrer' } });
          a.appendChild(span);
          this.headerTitle.appendChild(a);
        }
      }
      return;
    }
    const section = this.sections[sectionKey];
    if (!section) {
      this._applyTitleToHeader(t('title') || 'Error Logger & Viewer');
      return;
    }
    const titleEl = this._getSectionTitle(sectionKey, section);
    if (titleEl) {
      const i18nKey = titleEl.getAttribute('data-i18n');
      if (i18nKey && t(i18nKey)) this._applyTitleToHeader(t(i18nKey));
      else this._applyTitleToHeader(titleEl.textContent || t('title'));
    } else {
      this._applyTitleToHeader(t('title') || 'Error Logger & Viewer');
    }
  }

  _getSectionTitle(sectionKey: string, section: HTMLElement | null): Element | null {
    if (!section) return null;
    if (sectionKey === 'chart') return section.querySelector('.chart__title');
    if (sectionKey === 'stats') return section.querySelector('.stats__title');
    if (sectionKey === 'table') return section.querySelector('.error-table__title');
    return section.querySelector('h2,h3');
  }

  _applyTitleToHeader(text: string) {
    if (!this.headerTitle) return;
    const titleSpan = this.headerTitle.querySelector('[data-i18n="title"]');
    if (titleSpan) titleSpan.textContent = text;
    else this.headerTitle.textContent = text;
  }

  // Универсальная смена плейсхолдера и aria-label
  setSearchPlaceholder(mode: 'default' | 'table' = 'default') {
    if (!this.searchInput) return;
    if (mode === 'table') {
      this.searchInput.placeholder = t('placeholderTable') || t('Search in table...');
      this.searchInput.setAttribute('aria-label', t('ariaInputTable') || t('Search in table'));
    } else {
      this.searchInput.placeholder = t('placeholder') || t('Search by application...');
      this.searchInput.setAttribute('aria-label', t('ariaInput') || t('Search by application'));
    }
  }

  // Обновление заголовков секций при смене языка
  updateSectionTitles() {
    Object.entries(this.sections).forEach(([key, section]) => {
      if (!section) return;
      if (key === 'chart') {
        const titleEl = section.querySelector('.chart__title');
        if (titleEl) titleEl.textContent = t('chartTitle') || 'Error Chart';
        // перевод других узлов внутри графика
        translateNodes(section, '[data-i18n]');
        return;
      }
      // Перевод всех элементов с data-i18n в секции
      translateNodes(section, '[data-i18n]');
    });
  }

  // Обновление заголовка и плейсхолдера
  updateHeaderUI() {
    // Если видна только одна секция — её заголовок, иначе основной
    const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none');
    const key = visibleSections.length === 1 ? visibleSections[0][0] : null;
    const mode = key === 'table' ? 'table' : 'default';
    this.setHeaderTitleBySection(key);
    this.setSearchPlaceholder(mode);
  }

  init() {
    this.searchInput = qs<HTMLInputElement>('#searchInput');
    this.headerTitle = qs<HTMLElement>('.header__title');
    this.searchBtn = qs<HTMLElement>('#searchBtn');
    this.sections = {
      stats: qs<HTMLElement>('#errorStats'),
      chart: qs<HTMLElement>('#errorsChart'),
      table: qs<HTMLElement>('#errorTableSection'),
    };

    // Локализация при инициализации
    this.updateSectionTitles();
    // Обработка смены языка (убираем дублирование)
    const langEnBtn = qs<HTMLElement>('#lang-en');
    const langRuBtn = qs<HTMLElement>('#lang-ru');
    if (langEnBtn) langEnBtn.addEventListener('click', () => setLang('en'));
    if (langRuBtn) langRuBtn.addEventListener('click', () => setLang('ru'));
    onLangChange((lang) => {
      this.lang = lang;
      this.updateSectionTitles();
      this.updateHeaderUI();
      // Сброс фильтрации и возврат к полному приложению при смене языка
      if (this.searchInput) {
        this.searchInput.value = '';
        this.searchInput.dispatchEvent(new Event('input'));
      }
      this.filteredErrors = null;
      // Сброс таблицы: показать все ошибки через fetchErrors
      if (this.table && typeof this.table.fetchErrors === 'function') this.table.fetchErrors();
      this.showAllSections();
      this.setHeaderTitleBySection();
      this.setSearchPlaceholder('default');
      this.justSwitchedToTable = false;
      this.resetAllViews();
    });

    // Фильтрация при вводе (debounced)
    if (this.searchInput) {
      const debouncedSearch = this._debounce((value: string) => this.handleSearch(value), 250, 'searchInput');
      this.searchInput.addEventListener('input', (e) => {
        debouncedSearch((e.target as HTMLInputElement).value);
      });
      // Фильтрация по Enter (немедленно)
      this.searchInput.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter' && this.searchInput) this.handleSearch(this.searchInput.value);
      });
    }

    // Фильтрация по клику на лупу
    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', () => this.handleSearch(this.searchInput ? this.searchInput.value : ''));
    }

    // Добавляем обработчики сортировки по таблице
    this.addTableSortHandlers();

    // Переключение иконки поиска/выхода
    this.searchOrExitIcon = qs<HTMLElement>('#searchOrExitIcon');
    this.searchIcon = qs<HTMLElement>('#searchIcon');
    this.exitIcon = qs<HTMLElement>('#exitIcon');
    if (this.searchBtn && this.searchInput && this.searchOrExitIcon && this.searchIcon && this.exitIcon) {
      // Клик по exitIcon — всегда полный выход из фильтрации
      this.searchBtn.addEventListener('click', () => {
        if (this.exitIcon && this.exitIcon.style.display !== 'none') {
          const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && (sec as HTMLElement).style.display !== 'none');
          const onlyTableVisible = visibleSections.length === 1 && this.sections.table && this.sections.table.style.display !== 'none';
          const isTableFilterMode = this.searchInput && this.searchInput.placeholder === (t('placeholderTable') || t('Search in table...'));
          // 1. Фильтрация по таблице — двухэтапная логика
          if (onlyTableVisible && isTableFilterMode) {
            if (this.searchInput && this.searchInput.value) {
              // Первый клик: сброс фильтра таблицы, остаёмся в таблице
              this.searchInput.value = '';
              this.filteredErrors = null;
              this.setSearchPlaceholder('table');
              this.showOnlySection('table');
              if (this.searchIcon) this.searchIcon.style.display = '';
              if (this.exitIcon) this.exitIcon.style.display = '';
              this.resetAllViews();
            } else {
              // Второй клик: выход на главную
              this.filteredErrors = null;
              this.showAllSections();
              this.setHeaderTitleBySection(null); // Явно возвращаем основной заголовок
              if (this.searchIcon) this.searchIcon.style.display = '';
              if (this.exitIcon) this.exitIcon.style.display = 'none';
              this.setSearchPlaceholder('default');
              this.justSwitchedToTable = false;
              this.resetAllViews();
            }
          }
          // 2. Фильтрация по секциям — всегда полный выход
          else if (visibleSections.length === 1) {
            if (this.searchInput) this.searchInput.value = '';
            this.filteredErrors = null;
            this.showAllSections();
            this.setHeaderTitleBySection(null); // Явно возвращаем основной заголовок
            if (this.searchIcon) this.searchIcon.style.display = '';
            if (this.exitIcon) this.exitIcon.style.display = 'none';
            this.setSearchPlaceholder('default');
            this.justSwitchedToTable = false;
            this.resetAllViews();
          } else {
            // Если видны несколько секций, используем стандартную логику
            this.handleSearch(this.searchInput ? this.searchInput.value : '');
          }
        } else {
          this.handleSearch(this.searchInput ? this.searchInput.value : '');
        }
      });
      // Переключение иконки при вводе
      if (this.searchInput) {
        this.searchInput.addEventListener('input', () => {
          const onlyTableVisible = Object.entries(this.sections).filter(([, sec]) => sec && (sec as HTMLElement).style.display !== 'none').length === 1 && this.sections.table && this.sections.table.style.display !== 'none';
          // Показываем крестик если есть текст или только таблица видна
          if (this.searchInput && (this.searchInput.value.trim() || onlyTableVisible)) {
            if (this.searchIcon) this.searchIcon.style.display = 'none';
            if (this.exitIcon) this.exitIcon.style.display = '';
          } else {
            if (this.searchIcon) this.searchIcon.style.display = '';
            if (this.exitIcon) this.exitIcon.style.display = 'none';
          }
        });
      }
    }
  }

  // Простая debounce-обёртка (храним таймеры по ключу на инстансе)
  // eslint-disable-next-line no-unused-vars
  _debounce(fn: (..._args: any[]) => void, wait = 200, key = '__default') {
    return (..._args: any[]) => {
      const existing = this._debounceTimers[key];
      if (existing) clearTimeout(existing as any);
      this._debounceTimers[key] = setTimeout(() => {
        fn(..._args);
        delete this._debounceTimers[key];
      }, wait);
    };
  }

  // Основная логика поиска и фильтрации
  handleSearch(query: string) {
    const lowerQuery = query.trim().toLowerCase();
    let anyVisible = false;
    let onlyTableVisible = false;
    // Проверяем, отображается ли только таблица
    const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none');
    if (visibleSections.length === 1 && visibleSections[0][0] === 'table') onlyTableVisible = true;
    if (onlyTableVisible) {
      // Очищаем инпут только при первом переходе к таблице
      if (!this.justSwitchedToTable) {
        if (this.searchInput) {
          this.searchInput.value = '';
          this.setSearchPlaceholder('table');
        }
        this.showOnlySection('table');
        showCenterSpinner(this.sections.table, 'page');
        this.filterTable('').finally(() => hideCenterSpinner(this.sections.table));
        this.justSwitchedToTable = true;
        return;
      }
      // Если уже в таблице, не очищаем value, фильтруем по текущему запросу
      showCenterSpinner(this.sections.table, 'page');
      this.filterTable(query).finally(() => hideCenterSpinner(this.sections.table));
      return;
    } else {
      this.justSwitchedToTable = false;
    }

    // Фильтрация по секциям (по заголовкам)
    Object.entries(this.sections).forEach(([key, section]) => {
      if (!section) return;
      let titleEl: Element | null = null;
      if (key === 'chart') titleEl = section.querySelector('.chart__title');
      else if (key === 'stats') titleEl = section.querySelector('.stats__title');
      else if (key === 'table') titleEl = section.querySelector('.error-table__title');
      else titleEl = section.querySelector('h2,h3');
      let localizedText = '';
      if (titleEl) {
        const i18nKey = titleEl.getAttribute('data-i18n');
        if (i18nKey && t(i18nKey)) localizedText = t(i18nKey).toLowerCase();
        else localizedText = titleEl.textContent?.toLowerCase() || '';
      }
      if (!lowerQuery || localizedText.includes(lowerQuery)) {
        section.style.display = '';
        anyVisible = true;
      } else {
        section.style.display = 'none';
      }
    });

    // Меняем заголовок в зависимости от видимых секций
    if (!lowerQuery || !anyVisible) {
      this.showAllSections();
      // Пересобираем ссылки на секции (на случай, если DOM изменился)
      this.sections = { stats: qs('#errorStats'), chart: qs('#errorsChart'), table: qs('#errorTableSection') };
      // Логируем видимость секций
      Object.entries(this.sections).forEach(([k, sec]) => {
        if (sec) console.debug('[Header] Секция', k, 'display:', sec.style.display, 'exists:', !!sec);
        else console.warn('[Header] Секция', k, 'не найдена!');
      });
      // Определяем сколько секций реально видимо
      const visibleSections = Object.entries(this.sections).filter(([, sec]) => sec && sec.style.display !== 'none');
      if (visibleSections.length === Object.keys(this.sections).length)
        // Все секции видимы — основной заголовок
        this.setHeaderTitleBySection(null);
      else {
        // Одна секция — её заголовок
        const key = visibleSections.length === 1 ? visibleSections[0][0] : null;
        this.setHeaderTitleBySection(key);
      }
      if (window.chartManager && typeof window.chartManager.resetToDefault === 'function') window.chartManager.resetToDefault();
    } else {
      // Показываем заголовок первой видимой секции
      const firstVisible = Object.values(this.sections).find((sec) => sec && sec.style.display !== 'none');
      const key = Object.entries(this.sections).find(([, sec]) => sec === firstVisible)?.[0];
      this.setHeaderTitleBySection(key || null);
    }

    // 2. Если выбрана таблица — сбрасываем инпут только при переходе к таблице по секционному поиску
    if (this.sections.table && this.sections.table.style.display !== 'none') {
      showCenterSpinner(this.sections.table, 'page');
      this.filterTable(query).finally(() => {
        hideCenterSpinner(this.sections.table);
        if (window.errorTableInstance && typeof window.errorTableInstance.fetchErrors === 'function') {
          window.errorTableInstance.fetchErrors();
        }
      });
    }
    // В самом конце handleSearch гарантируем смену плейсхолдера после всех асинхронных операций
    if (this.searchInput) this.setSearchPlaceholder(onlyTableVisible ? 'table' : 'default');
  }

  async filterTable(query: string) {
    // запрос id чтобы избежать гонок: только последний ответ должен обновлять UI
    const requestId = ++this._lastFilterRequestId;
    // Получаем все ошибки
    const errors = await this.api.getErrors({});
    if (requestId !== this._lastFilterRequestId) return;
    const filtered = filterErrors(errors, query, { getLabel, t });
    this.filteredErrors = Array.isArray(filtered) && Array.isArray(errors) && filtered.length < (errors?.length || 0) ? filtered : null;
    this.table.renderErrors(filtered);
  }

  addTableSortHandlers() {
    // Кнопки сортировки должны иметь id: sortById, sortByType, sortByCount, sortByFirstSeen, sortByLastSeen, sortByStatus
    const sortFields: Record<string, string>[] = [
      { id: 'sortById', field: 'id' },
      { id: 'sortByType', field: 'type' },
      { id: 'sortByCount', field: 'count' },
      { id: 'sortByFirstSeen', field: 'firstSeen' },
      { id: 'sortByLastSeen', field: 'lastSeen' },
      { id: 'sortByStatus', field: 'status' },
    ];
    this.sortOrder = { id: 'asc', type: 'asc', count: 'asc', firstSeen: 'asc', lastSeen: 'asc', status: 'asc' };

    // Делегированный обработчик: один слушатель для всех кнопок сортировки
    delegate(document, '[id^="sortBy"]', 'click', (ev: Event, target: Element) => {
      ev.preventDefault();
      const id = (target as HTMLElement).id;
      const field = sortFields.find((sf) => sf.id === id)?.field;
      if (field) this.handleTableSort(field);
    });
  }

  handleTableSort(field: string) {
    // Если есть фильтр — сортируем только по отфильтрованным данным
    let errorsToSort = this.filteredErrors || this.table.getErrors();
    // Если массив пустой — запрашиваем все ошибки
    if (!errorsToSort || !errorsToSort.length) errorsToSort = this.table.getErrors();
    const sorted = this.table.sortErrors([...errorsToSort], field, this.sortOrder[field]);
    this.table.renderErrors(sorted);
    // Переключаем направление для следующего клика
    this.sortOrder[field] = this.sortOrder[field] === 'asc' ? 'desc' : 'asc';
    // Обновляем filteredErrors, чтобы сортировка была по текущему фильтру
    if (this.filteredErrors) this.filteredErrors = sorted;
  }
}

// Инициализация HeaderManager при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  (window as any).headerManager = new HeaderManager();

  // Логика бургер-меню для мобильной версии
  const burger = qs<HTMLElement>('#headerBurgerBtn');
  const sidebar = qs<HTMLElement>('.sidebar');
  if (burger && sidebar) {
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.style.display = 'flex';
      sidebar.classList.add('sidebar--active');
      document.body.classList.add('sidebar-open');
    });

    // Закрытие по клику вне sidebar
    document.addEventListener('click', (e) => {
      const target = e.target as Element | null;
      if (sidebar.classList.contains('sidebar--active') && target && !sidebar.contains(target) && target !== burger) {
        sidebar.classList.remove('sidebar--active');
        document.body.classList.remove('sidebar-open');
        sidebar.style.display = 'none';
      }
    });
  }
});
