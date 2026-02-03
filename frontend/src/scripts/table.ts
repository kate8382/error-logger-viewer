import { el, setChildren } from 'redom';
import type { Mode } from '../../../types/api';
import type { ErrorItem } from '../../../types/errors';
import { ErrorApi } from './api';
import { StatsManager } from './stats';
import type { HeaderManager } from './header'; // Импортируем тип менеджера заголовка, чтобы безопасно приводить `window.headerManager` к реальному типу
import { qs, createElement, translateNodes } from './utils/dom';
import type { ChartManagerType } from './charts';
import { t, getCurrentLang, onLangChange } from './utils/i18n';
import { handleModuleLoadError } from './utils/moduleLoad';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading';

type FieldName = 'id' | 'type' | 'count' | 'firstSeen' | 'lastSeen' | 'status';

export class ErrorTable {
  errors: ErrorItem[];
  errorApi: ErrorApi;
  lang: string;

  constructor(mode: Mode | undefined = 'server') {
    this.errors = [];
    this.errorApi = new ErrorApi(mode);
    this.lang = getCurrentLang();
    onLangChange((lang: string) => {
      this.lang = lang;
      this.renderErrors(this.errors);
    });
  }

  setMode(mode: Mode): void {
    if (this.errorApi && typeof this.errorApi.setMode === 'function') {
      this.errorApi.setMode(mode);
    }
  }

  async fetchErrors() {
    const tableSection = qs<HTMLElement>('#errorTableSection');
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

  renderErrors(errors: ErrorItem[] | undefined): void {
    this.errors = errors || [];
    const tableBody = qs<HTMLElement>('#errorTableBody');
    if (!tableBody) return;

    const rows = this.errors.map((error) => {
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
      const actionsCell = this.createActionsCell(error);

      return el('tr', { className: 'error-table__row' }, [
        createElement('td', { className: 'error-table__cell error-table__cell--id' }, this.formatId(error.id)),
        createElement('td', { className: 'error-table__cell error-table__cell--data' }, typeText),
        createElement('td', { className: 'error-table__cell error-table__cell--count' }, String(error.count || 1)),
        createElement('td', { className: 'error-table__cell error-table__cell--firstseen' }, firstSeen),
        createElement('td', { className: 'error-table__cell error-table__cell--lastseen' }, lastSeen),
        el('td', { className: 'error-table__cell error-table__cell--status' }, statusText),
        actionsCell,
      ]);
    });
    setChildren(tableBody, rows);
    // Переводим кнопки после рендера
    translateNodes(tableBody, '.error-table__btn--edit[data-i18n], .error-table__btn--delete[data-i18n]');

    // Скрываем спиннер после рендера
    const tableSection = qs<HTMLElement>('#errorTableSection');
    hideCenterSpinner(tableSection);
  }

  createActionsCell(error: ErrorItem): HTMLElement {
    const actionsCell = createElement('td', {
      className: 'error-table__cell error-table__cell--actions flex',
    });

    const dropdownBtn = createElement(
      'button',
      {
        className: 'error-table__dropdown-btn flex',
        ariaLabel: t('tableActions') || 'Actions',
      },
      '⋮',
    );
    const editBtn = this.createEditButton(error);
    const deleteBtn = this.createDeleteButton(error);
    const dropdownMenu = createElement('div', { className: 'error-table__dropdown-menu' });
    dropdownMenu.appendChild(editBtn);
    dropdownMenu.appendChild(deleteBtn);

    dropdownBtn.addEventListener('click', (ev: Event) => {
      ev.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'flex' : 'none';
    });
    // Добавляем обработчик для закрытия выпадающих меню, привязанный к таблице (#errorTable)
    if (!window.__errorTableDropdownListenerAdded) {
      const tableEl = qs<HTMLElement>('#errorTable');
      const root = tableEl || document.body;
      root.addEventListener('click', (ev: Event) => {
        const target = ev.target as Node;
        const container = tableEl || document;
        const menus = (container as ParentNode).querySelectorAll<HTMLElement>('.error-table__dropdown-menu');
        menus.forEach((menu) => {
          const toggleBtn = menu.previousElementSibling as HTMLElement | null;
          if (!menu.contains(target) && !(toggleBtn && toggleBtn.contains(target))) {
            menu.style.display = 'none';
          }
        });
      });
      window.__errorTableDropdownListenerAdded = true;
    }
    actionsCell.appendChild(dropdownBtn);
    actionsCell.appendChild(dropdownMenu);
    return actionsCell;
  }

  createEditButton(error: ErrorItem): HTMLButtonElement {
    const btn = createElement(
      'button',
      {
        className: 'error-table__btn error-table__btn--edit',
        dataI18n: 'tableEditBtn',
        ariaLabel: t('tableEditBtn') || 'Edit',
      },
      t('tableEditBtn'),
    );

    btn.addEventListener('click', async () => {
      try {
        const mod = await import('./utils/loading');
        // eslint-disable-next-line no-unused-vars
        const showLoading = mod.showLoading as (_btn?: HTMLElement, mode?: string) => void;
        // eslint-disable-next-line no-unused-vars
        const hideLoading = mod.hideLoading as (_btn?: HTMLElement | undefined) => void;
        showLoading(btn, 'save');

        import('./modal')
          .then(({ Modal }: { Modal: any }) => {
            // Приведение `window.app` к минимальному типу, чтобы безопасно читать `errorApi.mode`
            const app = window.app as unknown as { errorApi?: { mode?: 'server' | 'demo' } } | undefined;
            const mode = app?.errorApi?.mode || 'server';
            const modal = new Modal(mode);
            window.appModal = modal;
            modal.openEdit(error);
            setTimeout(() => hideLoading(btn), 0);
          })
          .catch((err: unknown) => {
            handleModuleLoadError('Ошибка при открытии модального окно редактирования:', err, hideLoading, btn);
          });
      } catch (impErr: unknown) {
        handleModuleLoadError('Failed to load loading utils for edit', impErr);
      }
    });
    return btn;
  }

  createDeleteButton(error: ErrorItem): HTMLButtonElement {
    const btn = createElement(
      'button',
      {
        className: 'error-table__btn error-table__btn--delete',
        dataI18n: 'tableDeleteBtn',
        ariaLabel: t('tableDeleteBtn') || 'Delete',
      },
      t('tableDeleteBtn'),
    );

    btn.addEventListener('click', async () => {
      try {
        const { showLoading, hideLoading } = await import('./utils/loading');
        showLoading(btn, 'delete');

        import('./modal')
          .then(({ Modal }) => {
            const app = window.app as unknown as { errorApi?: { mode?: 'server' | 'demo' } } | undefined;
            const mode = app?.errorApi?.mode || 'server';
            const modal = new Modal(mode);
            window.appModal = modal;
            modal.deleteError(error.id);
            // После завершения действия скрываем спиннер
            setTimeout(() => hideLoading(btn), 0);
          })
          .catch((error) => {
            // Оборачиваем hideLoading в функцию с необязательным параметром, чтобы соответствовать типу (btn?: HTMLElement | undefined) => void
            handleModuleLoadError(
              'Ошибка при открытии модального окна удаления:',
              error,
              (b?: HTMLElement) => {
                if (b) hideLoading(b);
              },
              btn,
            );
          });
      } catch (impErr) {
        handleModuleLoadError('Failed to load loading utils for delete (table)', impErr);
      }
    });
    return btn;
  }

  formatId(id: string): string {
    return id.length > 10 ? `${id.slice(0, 8)}-...${id.slice(-4)}` : id;
  }

  formatDate(dateStr: string): string {
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

  sortErrors(errors: ErrorItem[], field: string, order: string): ErrorItem[] {
    const statusOrder = ['new', 'in_progress', 'fixed', 'ignored'];
    const orders: 'asc' | 'desc' = order === 'desc' ? 'desc' : 'asc';
    // приведение поля к известному FieldName для ветвления, но сохранение оригинального поля для динамического доступа
    const fieldName = (['id', 'type', 'count', 'firstSeen', 'lastSeen', 'status'].includes(field) ? field : field) as FieldName;

    return errors.sort((a: ErrorItem, b: ErrorItem) => {
      if (fieldName === 'status') {
        const aStatus = (a.status || 'new').toString().toLowerCase();
        const bStatus = (b.status || 'new').toString().toLowerCase();
        const aIndex = statusOrder.indexOf(aStatus);
        const bIndex = statusOrder.indexOf(bStatus);
        if (aIndex !== -1 && bIndex !== -1) {
          return orders === 'asc' ? aIndex - bIndex : bIndex - aIndex;
        } else if (aIndex !== -1) {
          return orders === 'asc' ? -1 : 1;
        } else if (bIndex !== -1) {
          return orders === 'asc' ? 1 : -1;
        } else {
          const aText = t(aStatus) || aStatus;
          const bText = t(bStatus) || bStatus;
          return orders === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
        }
      }
      if (fieldName === 'id') {
        const aValue = a.id ? a.id.toString().toLowerCase() : '';
        const bValue = b.id ? b.id.toString().toLowerCase() : '';
        return orders === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
      if (fieldName === 'count') {
        const aCount = Number(a.count ?? 0);
        const bCount = Number(b.count ?? 0);
        return orders === 'asc' ? aCount - bCount : bCount - aCount;
      }
      if (fieldName === 'firstSeen') {
        const getFirstSeen = (err: ErrorItem) => err.firstSeen || '';
        const aValue = getFirstSeen(a) ? new Date(getFirstSeen(a)).getTime() : 0;
        const bValue = getFirstSeen(b) ? new Date(getFirstSeen(b)).getTime() : 0;
        return orders === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (fieldName === 'lastSeen') {
        const getLastSeen = (err: ErrorItem) => err.lastSeen || '';
        const aValue = getLastSeen(a) ? new Date(getLastSeen(a)).getTime() : 0;
        const bValue = getLastSeen(b) ? new Date(getLastSeen(b)).getTime() : 0;
        return orders === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Для других строковых полей (используем приведение к any для динамического доступа)
      const aRaw: unknown = (a as unknown as Record<string, unknown>)[field];
      const bRaw: unknown = (b as unknown as Record<string, unknown>)[field];
      const aValue = String(aRaw ?? '').toLowerCase();
      const bValue = String(bRaw ?? '').toLowerCase();
      return orders === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    });
  }
}

// Инициализация таблицы и статистики при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Используем существующий глобальный экземпляр, если он уже создан (например в main.js),
  // чтобы не перезаписывать инстанс и избежать рассинхронизации данных.
  const existing = window.errorTableInstance as unknown as ErrorTable | undefined;
  const errorTable = existing || new ErrorTable();
  window.errorTableInstance = errorTable;
  // При инициализации вызываем fetchErrors, приводя тип глобального инстанса к реальному.
  // !!! используем явное приведение, чтобы TypeScript видел методы экземпляра.
  if (typeof errorTable.fetchErrors === 'function') errorTable.fetchErrors();
  window.renderErrorTable = (errors) => {
    errorTable.renderErrors(errors);
    const statsManager = new StatsManager(errors);
    statsManager.renderErrorCards();
    // Локальное приведение `chartManager` перед вызовом метода — безопасно и избегает зависимости от большого ambient-файла
    {
      const cm = window.chartManager as unknown as ChartManagerType | undefined;
      if (cm && typeof cm.renderChart === 'function') cm.renderChart();
    }
  };

  // Состояние направления сортировки
  let sortOrder: Record<FieldName, 'asc' | 'desc'> = {
    id: 'asc',
    type: 'asc',
    count: 'asc',
    firstSeen: 'asc',
    lastSeen: 'asc',
    status: 'asc',
  };

  // Универсальный обработчик сортировки
  async function handleSort(field: FieldName) {
    // Если фильтр активен — сортируем только по отфильтрованным данным
    // Локальное приведение `window.headerManager` к типу HeaderManager - это позволяет обращаться к `filteredErrors` без большого ambient-файла.
    const hm = window.headerManager as unknown as HeaderManager | undefined;
    if (hm && hm.filteredErrors) {
      const filtered = hm.filteredErrors;
      const sorted = errorTable.sortErrors([...filtered], field, sortOrder[field]);
      errorTable.renderErrors(sorted);
      // Обновляем filteredErrors, чтобы сортировка была по текущему фильтру
      hm.filteredErrors = sorted;
      return;
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

  const sortIdBtn = qs<HTMLElement>('#sortById');
  if (sortIdBtn) {
    sortIdBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('id');
    });
  }

  const sortTypeBtn = qs<HTMLElement>('#sortByType');
  if (sortTypeBtn) {
    sortTypeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('type');
    });
  }

  const sortCountBtn = qs<HTMLElement>('#sortByCount');
  if (sortCountBtn) {
    sortCountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('count');
    });
  }
  const sortFirstSeenBtn = qs<HTMLElement>('#sortByFirstSeen');
  if (sortFirstSeenBtn) {
    sortFirstSeenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('firstSeen');
    });
  }
  const sortLastSeenBtn = qs<HTMLElement>('#sortByLastSeen');
  if (sortLastSeenBtn) {
    sortLastSeenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('lastSeen');
    });
  }

  const sortStatusBtn = qs<HTMLElement>('#sortByStatus');
  if (sortStatusBtn) {
    sortStatusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSort('status');
    });
  }
});
