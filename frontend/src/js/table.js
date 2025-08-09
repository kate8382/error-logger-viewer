import { el, setChildren } from 'redom';
import { ErrorApi } from './api';
import { translations } from './i18n';

export class ErrorTable {
  constructor() {
    this.lang = (navigator.language || navigator.userLanguage).startsWith('ru') ? 'ru' : 'en';
    this.errorApi = new ErrorApi();
    this.translations = translations;
  }

  async fetchErrors() {
    try {
      const errors = await this.errorApi.getErrors();
      this.renderErrors(errors);
    } catch (error) {
      console.error('Ошибка при получении данных об ошибках:', error);
    }
  }

  renderErrors(errors) {
    const tableBody = document.getElementById('errorTableBody');
    if (!tableBody) return;

    const currentLang = window.app && window.app.lang ? window.app.lang : this.lang;
    const rows = errors.map(error => {
      // Перевод типа ошибки
      const typeKey = 'errorType_' + error.type;
      const typeText = this.translations[currentLang][typeKey] || error.type;
      return el('tr', { className: 'error-table__row' }, [
        el('td', { className: 'error-table__cell error-table__cell--id' }, this.formatId(error.id)),
        el('td', { className: 'error-table__cell error-table__cell--data' }, typeText),
        el('td', { className: 'error-table__cell error-table__cell--timestamp' }, this.formatDate(error.timestamp || error.createdAt || '')),
        el('td', { className: 'error-table__cell error-table__cell--message' }, error.message),
        el('td', { className: 'error-table__cell error-table__cell--actions' }, [
          this.createViewButton(error),
          this.createDeleteButton(error)
        ])
      ]);
    });
    setChildren(tableBody, { className: 'error-table__body' }, rows);

    // Переводим кнопки View/Delete после рендера, используя актуальный язык
    const viewBtns = tableBody.querySelectorAll('.error-table__btn--view[data-i18n]');
    viewBtns.forEach(btn => {
      const key = btn.getAttribute('data-i18n');
      btn.textContent = this.translations[currentLang][key] || key;
    });
    const deleteBtns = tableBody.querySelectorAll('.error-table__btn--delete[data-i18n]');
    deleteBtns.forEach(btn => {
      const key = btn.getAttribute('data-i18n');
      btn.textContent = this.translations[currentLang][key] || key;
    });
  }

  createViewButton(error) {
    const btn = el('button', { className: 'error-table__btn error-table__btn--view', 'data-i18n': 'tableViewBtn', 'aria-label': this.translations[this.lang]['tableViewBtn'] || 'View' }, 'View');
    btn.addEventListener('click', () => {
      import('./modal').then(({ Modal }) => {
        const modal = new Modal();
        modal.open(error);
      }).catch(error => {
        console.error('Ошибка при открытии модального окна:', error);
      });
    });
    return btn;
  }

  createDeleteButton(error) {
    const btn = el('button', { className: 'error-table__btn error-table__btn--delete', 'data-i18n': 'tableDeleteBtn', 'aria-label': this.translations[this.lang]['tableDeleteBtn'] || 'Delete' }, 'Delete');
    btn.addEventListener('click', () => {
      import('./modal').then(({ Modal }) => {
        const modal = new Modal();
        modal.deleteError(error.id);
      }).catch(error => {
        console.error('Ошибка при открытии модального окна удаления:', error);
      });
    });
    return btn;
  }

  formatId(id) {
    return id.length > 10 ? `${id.slice(0, 8)}-...${id.slice(-4)}` : id;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(this.lang, { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      '  ' + date.toLocaleTimeString(this.lang, { hour: '2-digit', minute: '2-digit' });
  }

  sortErrors(errors, field, order = 'asc') {
    return errors.sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Для времени сравниваем либо timestamp, либо createdAt
      if (field === 'timestamp') {
        aValue = a.timestamp || a.createdAt ? new Date(a.timestamp || a.createdAt).getTime() : 0;
        bValue = b.timestamp || b.createdAt ? new Date(b.timestamp || b.createdAt).getTime() : 0;
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
}

// Инициализация таблицы при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const errorTable = new ErrorTable();
  errorTable.fetchErrors();
  window.renderErrorTable = errors => errorTable.renderErrors(errors);

  // Состояние направления сортировки
  let sortOrder = {
    id: 'asc',
    type: 'asc',
    timestamp: 'asc'
  };

  // Универсальный обработчик сортировки
  async function handleSort(field) {
    // Если серверный режим — сортировка через API
    if (errorTable.errorApi.mode === 'server') {
      const errors = await errorTable.errorApi.getErrors({ sort: field, order: sortOrder[field] });
      errorTable.renderErrors(errors);
    } else {
      // Локальная сортировка
      const errors = await errorTable.errorApi.getErrors();
      const sorted = errorTable.sortErrors(errors, field, sortOrder[field]);
      errorTable.renderErrors(sorted);
    }
    // Переключаем направление для следующего клика
    sortOrder[field] = sortOrder[field] === 'asc' ? 'desc' : 'asc';
  }

  const sortIdBtn = document.getElementById('sortById');
  if (sortIdBtn) {
    sortIdBtn.addEventListener('click', e => {
      e.preventDefault();
      handleSort('id');
    });
  }

  const sortTypeBtn = document.getElementById('sortByType');
  if (sortTypeBtn) {
    sortTypeBtn.addEventListener('click', e => {
      e.preventDefault();
      handleSort('type');
    });
  }

  const sortTimestampBtn = document.getElementById('sortByTimestamp');
  if (sortTimestampBtn) {
    sortTimestampBtn.addEventListener('click', e => {
      e.preventDefault();
      handleSort('timestamp');
    });
  }
});
