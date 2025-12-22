import { el, setChildren } from 'redom';
import { ErrorApi } from './api';
import { StatsManager } from './stats';
import { t, getCurrentLang, onLangChange } from './utils/i18n.js';
import { handleModuleLoadError } from './utils/moduleLoad.js';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading';

export class ErrorTable {
  constructor(mode = 'server') {
    this.errors = [];
    this.errorApi = new ErrorApi(mode);
    this.lang = getCurrentLang();
    onLangChange((lang) => {
      this.lang = lang;
      this.renderErrors(this.errors);
    });
  }

  setMode(mode) {
    if (this.errorApi && typeof this.errorApi.setMode === 'function') {
      this.errorApi.setMode(mode);
    }
  }

  async fetchErrors() {
    const tableSection = document.getElementById('errorTableSection');
    showCenterSpinner(tableSection, 'page'); // сразу показываем

    try {
      const errors = await this.errorApi.getErrors({});
      this.renderErrors(errors);
      if (window.renderErrorTable) {
        window.renderErrorTable(errors);
      }
    } catch (error) {
      console.error('Ошибка при получении данных об ошибках:', error);
    }
  }

  getErrors() {
    return this.errors;
  }

  renderErrors(errors) {
    this.errors = errors || [];
    const tableBody = document.getElementById('errorTableBody');
    if (!tableBody) return;

    const rows = errors.map((error) => {
      // Перевод типа ошибки
      const typeKey = 'errorType_' + error.type;
      const typeText = t(typeKey) || error.type;
      // Перевод статуса ошибки
      let status = error.status || 'new';
      let statusText = t(status) || status;
      // Форматирование дат
      const firstSeen = error.firstSeen ? this.formatDate(error.firstSeen) : '';
      const lastSeen = error.lastSeen ? this.formatDate(error.lastSeen) : '';
      // Выпадающее меню действий через методы
      const actionsCell = el('td', {
        className: 'error-table__cell error-table__cell--actions flex',
      });

      const dropdownBtn = el(
        'button',
        {
          className: 'error-table__dropdown-btn flex',
          'aria-label': t('tableActions') || 'Actions',
        },
        '⋮',
      );
      const editBtn = this.createEditButton(error);
      const deleteBtn = this.createDeleteButton(error);
      editBtn.style.margin = '2px 0';
      deleteBtn.style.margin = '2px 0';
      const dropdownMenu = el('div', { className: 'error-table__dropdown-menu' }, [editBtn, deleteBtn]);

      // Открытие/закрытие меню
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'flex' : 'none';
      });
      // Закрытие по клику вне меню
      document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
      });
      actionsCell.appendChild(dropdownBtn);
      actionsCell.appendChild(dropdownMenu);

      return el('tr', { className: 'error-table__row' }, [
        el('td', { className: 'error-table__cell error-table__cell--id' }, this.formatId(error.id)),
        el('td', { className: 'error-table__cell error-table__cell--data' }, typeText),
        el('td', { className: 'error-table__cell error-table__cell--count' }, error.count || 1),
        el('td', { className: 'error-table__cell error-table__cell--firstseen' }, firstSeen),
        el('td', { className: 'error-table__cell error-table__cell--lastseen' }, lastSeen),
        el('td', { className: 'error-table__cell error-table__cell--status' }, statusText),
        actionsCell,
      ]);
    });
    setChildren(tableBody, rows);

    // Переводим кнопки Edit/Delete после рендера, используя актуальный язык
    const editBtns = tableBody.querySelectorAll('.error-table__btn--edit[data-i18n]');
    editBtns.forEach((btn) => {
      const key = btn.getAttribute('data-i18n');
      btn.textContent = t(key) || key;
    });
    const deleteBtns = tableBody.querySelectorAll('.error-table__btn--delete[data-i18n]');
    deleteBtns.forEach((btn) => {
      const key = btn.getAttribute('data-i18n');
      btn.textContent = t(key) || key;
    });

    // Скрываем спиннер после рендера
    const tableSection = document.getElementById('errorTableSection');
    hideCenterSpinner(tableSection);
  }

  createEditButton(error) {
    const btn = el(
      'button',
      {
        className: 'error-table__btn error-table__btn--edit',
        'data-i18n': 'tableEditBtn',
        'aria-label': t('tableEditBtn') || 'Edit',
      },
      t('tableEditBtn'),
    );

    btn.addEventListener('click', async () => {
      try {
        const { showLoading, hideLoading } = await import('./utils/loading');
        showLoading(btn, 'save');

        import('./modal')
          .then(({ Modal }) => {
            const mode = window.app && window.app.errorApi ? window.app.errorApi.mode : 'server';
            window.appModal = new Modal(mode);
            window.appModal.openEdit(error);
            hideLoading(btn);
          })
          .catch((error) => {
            handleModuleLoadError('Ошибка при открытии модального окно редактирования:', error, hideLoading, btn);
          });
      } catch (impErr) {
        handleModuleLoadError('Failed to load loading utils for edit', impErr);
      }
    });
    return btn;
  }

  createDeleteButton(error) {
    const btn = el(
      'button',
      {
        className: 'error-table__btn error-table__btn--delete',
        'data-i18n': 'tableDeleteBtn',
        'aria-label': t('tableDeleteBtn') || 'Delete',
      },
      t('tableDeleteBtn'),
    );

    btn.addEventListener('click', async () => {
      try {
        const { showLoading, hideLoading } = await import('./utils/loading');
        showLoading(btn, 'delete');

        import('./modal')
          .then(({ Modal }) => {
            const mode = window.app && window.app.errorApi ? window.app.errorApi.mode : 'server';
            window.appModal = new Modal(mode);
            window.appModal.deleteError(error.id);
            // После завершения действия скрываем спиннер
            hideLoading(btn);
          })
          .catch((error) => {
            handleModuleLoadError('Ошибка при открытии модального окна удаления:', error, hideLoading, btn);
          });
      } catch (impErr) {
        handleModuleLoadError('Failed to load loading utils for delete (table)', impErr);
      }
    });
    return btn;
  }

  formatId(id) {
    return id.length > 10 ? `${id.slice(0, 8)}-...${id.slice(-4)}` : id;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    // Формат: дд.мм.гггг  чч:мм
    const d = date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year}  ${hours}:${minutes}`;
  }

  sortErrors(errors, field, order = 'asc') {
    const statusOrder = ['new', 'in_progress', 'fixed', 'ignored'];

    return errors.sort((a, b) => {
      if (field === 'status') {
        const aStatus = (a.status || 'new').toString().toLowerCase();
        const bStatus = (b.status || 'new').toString().toLowerCase();
        const aIndex = statusOrder.indexOf(aStatus);
        const bIndex = statusOrder.indexOf(bStatus);
        if (aIndex !== -1 && bIndex !== -1) {
          return order === 'asc' ? aIndex - bIndex : bIndex - aIndex;
        } else if (aIndex !== -1) {
          return order === 'asc' ? -1 : 1;
        } else if (bIndex !== -1) {
          return order === 'asc' ? 1 : -1;
        } else {
          const aText = t(aStatus) || aStatus;
          const bText = t(bStatus) || bStatus;
          return order === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
        }
      }
      if (field === 'id') {
        const aValue = a.id ? a.id.toString().toLowerCase() : '';
        const bValue = b.id ? b.id.toString().toLowerCase() : '';
        return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
      if (field === 'count') {
        return order === 'asc' ? (a.count || 0) - (b.count || 0) : (b.count || 0) - (a.count || 0);
      }
      if (field === 'firstSeen') {
        const getFirstSeen = (err) => err.firstSeen || '';
        const aValue = getFirstSeen(a) ? new Date(getFirstSeen(a)).getTime() : 0;
        const bValue = getFirstSeen(b) ? new Date(getFirstSeen(b)).getTime() : 0;
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (field === 'lastSeen') {
        const getLastSeen = (err) => err.lastSeen || '';
        const aValue = getLastSeen(a) ? new Date(getLastSeen(a)).getTime() : 0;
        const bValue = getLastSeen(b) ? new Date(getLastSeen(b)).getTime() : 0;
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Для других строковых полей
      let aValue = a[field];
      let bValue = b[field];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    });
  }
}

// Инициализация таблицы и статистики при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Глобальный экземпляр для обновления из модалок
  const errorTable = new ErrorTable();
  window.errorTableInstance = errorTable;
  errorTable.fetchErrors();
  window.renderErrorTable = (errors) => {
    errorTable.renderErrors(errors);
    const statsManager = new StatsManager(errors);
    statsManager.renderErrorCards();
    if (window.chartManager) {
      window.chartManager.renderChart();
    }
  };

  // Состояние направления сортировки
  let sortOrder = {
    id: 'asc',
    type: 'asc',
    count: 'asc',
    firstSeen: 'asc',
    lastSeen: 'asc',
    status: 'asc',
  };

  // Универсальный обработчик сортировки
  async function handleSort(field) {
    // Если фильтр активен — сортируем только по отфильтрованным данным
    if (window.headerManager && window.headerManager.filteredErrors) {
      const filtered = window.headerManager.filteredErrors;
      const sorted = errorTable.sortErrors([...filtered], field, sortOrder[field]);
      errorTable.renderErrors(sorted);
      // Обновляем filteredErrors, чтобы сортировка была по текущему фильтру
      window.headerManager.filteredErrors = sorted;
    } else if (errorTable.errorApi.mode === 'server') {
      // Если серверный режим — сортировка через API
      const errors = await errorTable.errorApi.getErrors({
        sort: field,
        order: sortOrder[field],
      });
      errorTable.renderErrors(errors);
    } else {
      // Локальная сортировка по всем ошибкам
      const errors = await errorTable.errorApi.getErrors({});
      const sorted = errorTable.sortErrors(errors, field, sortOrder[field]);
      errorTable.renderErrors(sorted);
    }
    // Переключаем направление для следующего клика
    sortOrder[field] = sortOrder[field] === 'asc' ? 'desc' : 'asc';
  }

  const sortIdBtn = document.getElementById('sortById');
  if (sortIdBtn) {
    sortIdBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('id');
    });
  }

  const sortTypeBtn = document.getElementById('sortByType');
  if (sortTypeBtn) {
    sortTypeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('type');
    });
  }

  const sortCountBtn = document.getElementById('sortByCount');
  if (sortCountBtn) {
    sortCountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('count');
    });
  }
  const sortFirstSeenBtn = document.getElementById('sortByFirstSeen');
  if (sortFirstSeenBtn) {
    sortFirstSeenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('firstSeen');
    });
  }
  const sortLastSeenBtn = document.getElementById('sortByLastSeen');
  if (sortLastSeenBtn) {
    sortLastSeenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('lastSeen');
    });
  }

  const sortStatusBtn = document.getElementById('sortByStatus');
  if (sortStatusBtn) {
    sortStatusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('status');
    });
  }
});
