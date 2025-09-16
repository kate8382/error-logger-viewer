import { ErrorApi } from './api';
import { ErrorTable } from './table';
import { StatsManager } from './stats';
import ChartManager from './charts';
import { translations } from './utils/i18n';
import { getCurrentLang } from './utils/lang';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading';

export class HeaderManager {
  constructor() {
    this.api = new ErrorApi();
    this.table = window.errorTableInstance || new ErrorTable();
    this.stats = window.statsManager || new StatsManager();
    this.chart = window.chartManager || new ChartManager();
    this.lang = getCurrentLang();
    this.init();
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
    this.localizeHeader();

    // Фильтрация при вводе
    this.searchInput.addEventListener('input', e => this.handleSearch(e.target.value));

    // Фильтрация по Enter
    this.searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        this.handleSearch(this.searchInput.value);
      }
    });

    // Фильтрация по клику на лупу
    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', () => {
        this.handleSearch(this.searchInput.value);
      });
    }
  }

  localizeHeader() {
    // Локализуем заголовок и placeholder
    if (this.headerTitle) {
      this.headerTitle.textContent = translations[this.lang]?.title || 'Error Logger & Viewer';
    }
    if (this.searchInput) {
      this.searchInput.placeholder = translations[this.lang]?.placeholder || 'Search by application...';
    }
  }

  handleSearch(query) {
    // 1. Фильтрация по секциям (по заголовкам)
    const lowerQuery = query.trim().toLowerCase();
    let anyVisible = false;
    Object.entries(this.sections).forEach(([section]) => {
      if (!section) return;
      const titleEl = section.querySelector('h2,h3');
      const titleText = titleEl?.textContent?.toLowerCase() || '';
      if (!lowerQuery || titleText.includes(lowerQuery)) {
        section.style.display = '';
        anyVisible = true;
      } else {
        section.style.display = 'none';
      }
    });

    // Меняем заголовок
    if (!lowerQuery || !anyVisible) {
      this.headerTitle.textContent = translations[this.lang]?.title || 'Error Logger & Viewer';
    } else {
      // Показываем заголовок первой видимой секции
      const firstVisible = Object.values(this.sections).find(sec => sec && sec.style.display !== 'none');
      const titleEl = firstVisible?.querySelector('h2,h3');
      this.headerTitle.textContent = titleEl?.textContent || translations[this.lang]?.title || 'Error Logger & Viewer';
    }

    // 2. Если выбрана таблица — фильтрация по столбцам
    if (this.sections.table && this.sections.table.style.display !== 'none') {
      // Показываем спиннер на таблице
      showCenterSpinner(this.sections.table, 'page');
      this.filterTable(query).finally(() => {
        hideCenterSpinner(this.sections.table);
      });
      this.searchInput.placeholder = translations[this.lang]?.placeholder || 'Search in table...';
    } else {
      this.searchInput.placeholder = translations[this.lang]?.placeholder || 'Search by application...';
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