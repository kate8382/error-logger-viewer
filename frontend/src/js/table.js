import { el, setChildren } from 'redom';
import { ErrorApi } from './api';
import { translations } from './utils/i18n';
import { getCurrentLang } from './utils/lang';

export class ErrorTable {
  constructor() {
    this.lang = getCurrentLang();
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

    const lang = getCurrentLang();
    const rows = errors.map(error => {
      // Перевод типа ошибки
      const typeKey = 'errorType_' + error.type;
      const typeText = this.translations[lang][typeKey] || error.type;
      let status = error.status;
      let statusText = this.translations[lang][status] || status;
      if (!status) {
        statusText = lang === 'ru' ? 'Новая' : 'New';
      }
      return el('tr', { className: 'error-table__row' }, [
        el('td', { className: 'error-table__cell error-table__cell--id' }, this.formatId(error.id)),
        el('td', { className: 'error-table__cell error-table__cell--data' }, typeText),
        el('td', { className: 'error-table__cell error-table__cell--timestamp' }, this.formatDate(error.timestamp || error.createdAt || '')),
        el('td', { className: 'error-table__cell error-table__cell--status' }, statusText),
        el('td', { className: 'error-table__cell error-table__cell--actions' }, [
          this.createEditButton(error),
          this.createDeleteButton(error)
        ])
      ]);
    });
    setChildren(tableBody, rows);

    // Переводим кнопки Edit/Delete после рендера, используя актуальный язык
    const editBtns = tableBody.querySelectorAll('.error-table__btn--edit[data-i18n]');
    editBtns.forEach(btn => {
      const key = btn.getAttribute('data-i18n');
      btn.textContent = this.translations[lang][key] || key;
    });
    const deleteBtns = tableBody.querySelectorAll('.error-table__btn--delete[data-i18n]');
    deleteBtns.forEach(btn => {
      const key = btn.getAttribute('data-i18n');
      btn.textContent = this.translations[lang][key] || key;
    });
  }

  createEditButton(error) {
    const btn = el('button', { className: 'error-table__btn error-table__btn--edit', 'data-i18n': 'tableEditBtn', 'aria-label': this.translations[this.lang]['tableEditBtn'] || 'Edit' }, 'Edit');
    btn.addEventListener('click', async () => {
      const { showLoading, hideLoading } = await import('./utils/loading');
      showLoading(btn, 'save');
      // await new Promise(resolve => setTimeout(resolve, 5000));

      import('./modal').then(({ Modal }) => {
        if (!window.appModal) window.appModal = new Modal();
        window.appModal.openEdit(error);
        hideLoading(btn);
      }).catch(error => {
        console.error('Ошибка при открытии модального окна редактирования:', error);
        hideLoading(btn);
      });
    });
    return btn;
  }

  createDeleteButton(error) {
    const btn = el('button', { className: 'error-table__btn error-table__btn--delete', 'data-i18n': 'tableDeleteBtn', 'aria-label': this.translations[this.lang]['tableDeleteBtn'] || 'Delete' }, 'Delete');
    btn.addEventListener('click', async () => {
      const { showLoading, hideLoading } = await import('./utils/loading');
      showLoading(btn, 'delete');

      import('./modal').then(({ Modal }) => {
        if (!window.appModal) window.appModal = new Modal(); // Создаем модальное окно, если его еще нет
        window.appModal.deleteError(error.id);
        // После завершения действия скрываем спиннер
        hideLoading(btn);
      }).catch(error => {
        console.error('Ошибка при открытии модального окна удаления:', error);
        hideLoading(btn); // Скрываем спиннер в случае ошибки
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
    const lang = getCurrentLang();
    const translations = this.translations;
    const statusOrder = ['new', 'in_progress', 'fixed', 'ignored'];

    return errors.sort((a, b) => {
      if (field === 'status') {
        const aStatus = (a.status || 'new').toString().toLowerCase();
        const bStatus = (b.status || 'new').toString().toLowerCase();
        const aIndex = statusOrder.indexOf(aStatus);
        const bIndex = statusOrder.indexOf(bStatus);
        if (aIndex !== -1 && bIndex !== -1) {
          const result = order === 'asc' ? aIndex - bIndex : bIndex - aIndex;
          return result;
        } else if (aIndex !== -1) {
          return order === 'asc' ? -1 : 1;
        } else if (bIndex !== -1) {
          return order === 'asc' ? 1 : -1;
        } else {
          // Если оба не из списка — сортировать по переводу
          const aText = translations[lang][aStatus] || aStatus;
          const bText = translations[lang][bStatus] || bStatus;
          const result = order === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
          return result;
        }
      }
      if (field === 'timestamp') {
        const aValue = a.timestamp || a.createdAt ? new Date(a.timestamp || a.createdAt).getTime() : 0;
        const bValue = b.timestamp || b.createdAt ? new Date(b.timestamp || b.createdAt).getTime() : 0;
        const result = order === 'asc' ? aValue - bValue : bValue - aValue;
        return result;
      }
      if (field === 'id') {
        const aValue = a.id ? a.id.toString().toLowerCase() : '';
        const bValue = b.id ? b.id.toString().toLowerCase() : '';
        const result = order === 'asc'
          ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0)
          : (aValue < bValue ? 1 : aValue > bValue ? -1 : 0);
        return result;
      }
      // Для других строковых полей
      let aValue = a[field];
      let bValue = b[field];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      const result = order === 'asc'
        ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0)
        : (aValue < bValue ? 1 : aValue > bValue ? -1 : 0);
      return result;
    });
  }
}

// Инициализация таблицы при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Глобальный экземпляр для обновления из модалок
  const errorTable = new ErrorTable();
  window.errorTableInstance = errorTable;
  errorTable.fetchErrors();
  window.renderErrorTable = errors => errorTable.renderErrors(errors);

  // Состояние направления сортировки
  let sortOrder = {
    id: 'asc',
    type: 'asc',
    timestamp: 'asc',
    status: 'asc'
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

  const sortStatusBtn = document.getElementById('sortByStatus');
  if (sortStatusBtn) {
    sortStatusBtn.addEventListener('click', e => {
      e.preventDefault();
      handleSort('status');
    });
  }
});
