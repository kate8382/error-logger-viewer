import { el, setChildren } from 'redom';
import { ErrorApi } from './api';
import type { Mode } from './api';
import type { ErrorItem } from './types/errors';
import { qs, createElement, translateNodes, assertExists } from './utils/dom';
import { t, getLabel, onLangChange } from './utils/i18n';
import { handleModuleLoadError } from './utils/moduleLoad';

export class Modal {
  static _instance: Modal | null = null; // Синглтон экземпляр модального окна
  mode: Mode = 'server'; // Режим работы (server или demo)
  errorApi: ErrorApi | undefined; // API для работы с ошибками
  modal: HTMLElement | null = null; // Основной элемент модального окна
  modalContent: HTMLElement | null = null; // Контейнер для контента модального окна
  modalClose: NodeListOf<Element> | null = null; // Кнопки закрытия модального окна
  addedEsc = false; // Флаг для отслеживания добавления обработчика Escape
  // eslint-disable-next-line no-unused-vars
  _outsideClickHandler: (event: MouseEvent) => void = () => {}; // Обработчик клика по фону модального окна
  // eslint-disable-next-line no-unused-vars
  _closeCustomSelect: ((e: MouseEvent) => void) | undefined; // Обработчик для закрытия кастомного селекта
  _lastErrorForEdit: ErrorItem | null = null; // Последняя открытая ошибка для редактирования
  _lastErrorIdForDelete: string | null = null; // Последний открытый ID ошибки для удаления

  constructor(mode: Mode = 'server') {
    if (Modal._instance && Modal._instance.mode === mode) {
      return Modal._instance;
    }
    this.mode = mode;
    this.errorApi = new ErrorApi(mode);
    // Подписка на смену языка для обновления модального окна, если оно открыто
    onLangChange(() => {
      if (this.modal && this.modal.classList.contains('modal--open')) {
        if (this._lastErrorForEdit) {
          this.openEdit(this._lastErrorForEdit, true);
        } else if (this._lastErrorIdForDelete) {
          this.deleteError(this._lastErrorIdForDelete, true);
        }
      }
    });
    this.modal = assertExists(qs<HTMLElement>('#modal'), '#modal');
    this.modalContent = assertExists(qs<HTMLElement>('#modalContent'), '#modalContent');

    this.modalClose = document.querySelectorAll('.modal__close');
    Array.from(this.modalClose).forEach((closeBtn) => {
      closeBtn.addEventListener('click', () => this.close());
    });

    // Глобальный обработчик Escape
    this.addedEsc = false;
    this.addEscListener();

    // Для клика по фону — обработчик будет добавляться/удаляться при открытии/закрытии
    this._outsideClickHandler = (event: MouseEvent): void => {
      if (event.target === this.modal) {
        this.close();
      }
    };

    Modal._instance = this;
  }

  // Устанавливает фокус на первый фокусируемый элемент в модалке
  _setInitialModalFocus(): void {
    const focusableSelectors = ['button:not([disabled])', '[href]', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'];

    if (!this.modalContent) return;
    const focusable = this.modalContent.querySelectorAll(focusableSelectors.join(','));
    const focusableArr = Array.from(focusable).filter((el) => (el as HTMLElement).offsetParent !== null);

    if (focusableArr.length) (focusableArr[0] as HTMLElement).focus();
  }

  addEscListener(): void {
    if (!this.addedEsc) {
      document.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          this.close();
        }
      });
      this.addedEsc = true;
    }
  }

  // Устанавливает/снимает inert для элементов фона, оставляя модалку интерактивной
  _setBackgroundInert(enable: boolean): void {
    if (!this.modal) return;
    let el: HTMLElement | null = this.modal as HTMLElement;
    while (el && el !== document.body) {
      const parent = el.parentElement;
      if (!parent) break;
      Array.from(parent.children).forEach((sibling) => {
        if (sibling !== el) {
          try {
            if (enable) sibling.setAttribute('inert', '');
            else sibling.removeAttribute('inert');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
          } catch (e) {
            // ignore if browser doesn't support inert
          }
        }
      });
      el = parent as HTMLElement;
    }
  }

  createCloseBtn() {
    const closeBtn = createElement(
      'button',
      {
        className: 'modal__close',
        ariaLabel: t('modalCloseBtn'),
      },
      '×',
    );
    closeBtn.addEventListener('click', () => this.close());
    return closeBtn;
  }

  openEdit(error: ErrorItem, _isLangChange: boolean = false): void {
    if (!this.modal || !this.modalContent) return;
    void _isLangChange;
    this._lastErrorForEdit = error;

    const typeLabel = t('modalField_type');
    const idLabel = t('modalField_id');
    const firstSeenLabel = t('modalField_firstSeen');
    const lastSeenLabel = t('modalField_lastSeen');
    const countLabel = t('modalField_count');
    const usersLabel = t('modalField_users');
    const messageLabel = t('modalField_message');
    const sourceLabel = t('modalField_source');
    const stackLabel = t('modalField_stack');
    const statusLabel = t('modalField_status');
    const commentLabel = t('modalField_comment');

    const title = createElement('h2', { className: 'modal__title', attrs: { id: 'modalTitle' }, dataI18n: 'modalTitle' }, t('modalTitle'));

    // Для типа ошибки используем перевод
    let type = error.type || '';
    type = getLabel(type) || type;
    const id = error.id || '';
    // Формат даты: дд.мм.гггг чч:мм
    let firstSeenValue = error.firstSeen ? this._formatDate(error.firstSeen) : '';
    let lastSeenValue = error.lastSeen ? this._formatDate(error.lastSeen) : '';
    const countValue = typeof error.count === 'number' ? error.count : 1;
    const usersValue = Array.isArray(error.users) ? error.users.join(', ') : '';
    const message = error.message || '';
    const comment = String(error.comment || '');
    const statusOptions: Array<{ value: string, label: string }> = [
      { value: 'new', label: t('new') },
      { value: 'in_progress', label: t('in_progress') },
      { value: 'fixed', label: t('fixed') },
      { value: 'ignored', label: t('ignored') },
    ];
    let currentStatus = statusOptions.find((opt) => opt.value === error.status) ?? statusOptions[0];
    // Универсальный select для всех статусов
    const statusSelect = createElement(
      'div',
      {
        className: 'modal__status-select is-close',
        tabindex: '0',
        role: 'button',
        'aria-haspopup': 'listbox',
        'aria-expanded': 'false',
        ariaLabel: t('modalField_status'),
      },
      [
        createElement('span', { className: 'modal__status-current' }, currentStatus.label),
        // Вставляем SVG через innerHTML, как в aside
        (() => {
          const svg = document.createElement('span');
          svg.innerHTML = '<svg class="modal__status-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5.4975L2.12175 3.375L9.003 10.3792L15.8783 3.375L18 5.4975L9.003 14.625L0 5.4975Z" fill="currentColor"/></svg>';
          return svg.firstChild as Node;
        })(),
        createElement(
          'ul',
          {
            className: 'modal__status-list',
            style: 'display: none;',
            role: 'listbox',
          },
          ...statusOptions.filter((opt) => opt.value !== currentStatus.value).map((opt) => el('li', { 'data-value': opt.value, className: 'modal__status-option', tabindex: '0', role: 'option' } as any, opt.label)),
        ),
      ],
    );
    const currentSpan = (statusSelect as HTMLElement).querySelector('.modal__status-current') as HTMLElement;
    const list = (statusSelect as HTMLElement).querySelector('.modal__status-list') as HTMLElement | null;

    // Локальные helpers для открытия/закрытия селекта — чтобы убрать дублирование
    const closeStatusSelect = (): void => {
      (statusSelect as HTMLElement).classList.remove('is-open');
      (statusSelect as HTMLElement).classList.add('is-close');
      if (list) list.style.display = 'none';
      (statusSelect as HTMLElement).setAttribute('aria-expanded', 'false');
      if (this._closeCustomSelect) {
        document.removeEventListener('mousedown', this._closeCustomSelect);
        (window as any).closeCustomSelectModal = undefined;
      }
    };

    const openStatusSelect = (): void => {
      (statusSelect as HTMLElement).classList.add('is-open');
      (statusSelect as HTMLElement).classList.remove('is-close');
      if (list) list.style.display = 'block';
      (statusSelect as HTMLElement).setAttribute('aria-expanded', 'true');
      if (this._closeCustomSelect) {
        (window as any).closeCustomSelectModal = this._closeCustomSelect;
        document.addEventListener('mousedown', this._closeCustomSelect);
      }
      const firstOption = list ? (list.querySelector('.modal__status-option') as HTMLElement | null) : null;
      if (firstOption) firstOption.focus();
    };

    // Вынесено в приватный метод класса
    this._closeCustomSelect = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target || !(statusSelect as HTMLElement).contains(target)) {
        closeStatusSelect();
      }
    };
    statusSelect.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if ((statusSelect as HTMLElement).classList.contains('is-open')) {
        closeStatusSelect();
      } else {
        openStatusSelect();
      }
    });

    // Открытие селекта по Enter/Space
    statusSelect.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!(statusSelect as HTMLElement).classList.contains('is-open')) {
          e.preventDefault();
          openStatusSelect();
        }
      }
    });

    // Навигация по опциям селекта с помощью Tab/Shift+Tab и стрелок
    if (list) {
      list.addEventListener('keydown', (e: KeyboardEvent) => {
        const options = Array.from(list.querySelectorAll('.modal__status-option'));
        const idx = options.indexOf(document.activeElement as Element);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (idx < options.length - 1) {
            (options[idx + 1] as HTMLElement).focus();
          } else {
            (options[0] as HTMLElement).focus();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (idx > 0) {
            (options[idx - 1] as HTMLElement).focus();
          } else {
            (options[options.length - 1] as HTMLElement).focus();
          }
        } else if (e.key === 'Tab') {
          if (!e.shiftKey && idx === options.length - 1) {
            e.preventDefault();
            (options[0] as HTMLElement).focus();
          } else if (e.shiftKey && idx === 0) {
            e.preventDefault();
            (options[options.length - 1] as HTMLElement).focus();
          }
        } else if (e.key === 'Escape') {
          closeStatusSelect();
          (statusSelect as HTMLElement).focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.click?.();
        }
      });
      // Выбор опции
      list.addEventListener('click', (e: MouseEvent) => {
        const targetEl = e.target as Element | null;
        if (targetEl && targetEl.matches('li')) {
          const value = targetEl.getAttribute('data-value');
          const label = targetEl.textContent;
          currentStatus = statusOptions.find((opt) => opt.value === value) || statusOptions[0];
          currentSpan.textContent = label || '';
          // Пересоздать список без выбранной опции
          list.innerHTML = '';
          statusOptions
            .filter((opt) => opt.value !== currentStatus.value)
            .forEach((opt) => {
              const li = createElement('li', { className: 'modal__status-option', attrs: { 'data-value': opt.value } }, opt.label);
              list.appendChild(li);
            });
          // закрыть список
          closeStatusSelect();
        }
      });
    }
    // Escape — закрыть
    statusSelect.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeStatusSelect();
      }
    });

    const commentArea = createElement(
      'textarea',
      {
        className: 'modal__comment-area',
        rows: 3,
        placeholder: `${commentLabel} ...`,
        ariaLabel: t('modalField_comment'),
      },
      comment,
    ) as HTMLTextAreaElement;

    // Обработчик событий Enter для сохранения комментария
    // Остальные поля (только для просмотра)
    // Исключаем устаревшие и служебные поля
    const exclude = ['type', 'id', 'message', 'status', 'comment', 'firstSeen', 'lastSeen', 'count', 'users', 'createdAt', 'updatedAt', 'modalField_createdAt'];
    const otherRows = Object.entries(error)
      .filter(([key, value]) => !exclude.includes(key) && typeof value !== 'object' && value !== '' && value !== null && value !== undefined)
      .map(([key, value]) => {
        let label;
        if (key === 'source') {
          label = sourceLabel;
        } else if (key === 'stack') {
          label = stackLabel;
        } else {
          const labelKey = 'modalField_' + key;
          label = t(labelKey) || key.charAt(0).toUpperCase() + key.slice(1);
        }
        return createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, label + ': '), createElement('span', { className: 'modal__field-value' }, String(value))]);
      });

    const rows = [
      createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, typeLabel + ': '), createElement('span', { className: 'modal__field-value', attrs: { 'data-type': String(error.type) } }, type)]),
      createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, idLabel + ': '), createElement('span', { className: 'modal__field-value' }, id)]),
      createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, firstSeenLabel + ': '), createElement('span', { className: 'modal__field-value' }, firstSeenValue)]),
      createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, lastSeenLabel + ': '), createElement('span', { className: 'modal__field-value' }, lastSeenValue)]),
      createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, countLabel + ': '), createElement('span', { className: 'modal__field-value' }, countValue)]),
      createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, usersLabel + ': '), createElement('span', { className: 'modal__field-value' }, usersValue)]),
      ...otherRows,
      createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, messageLabel + ': '), createElement('span', { className: 'modal__field-value' }, message)]),
      createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, statusLabel + ': '), statusSelect]),
      createElement('div', { className: 'modal__row' }, [createElement('span', { className: 'modal__field-title' }, commentLabel + ': '), commentArea]),
    ];

    const saveBtn = createElement(
      'button',
      {
        className: 'modal__button',
        id: 'saveModalButton',
        dataI18n: 'modalSaveBtn',
        ariaLabel: t('modalSaveBtn'),
      },
      t('modalSaveBtn'),
    );
    saveBtn.addEventListener('click', async () => {
      const newStatus = currentStatus.value;
      const newComment = commentArea.value;
      const updated = { ...error, status: newStatus, comment: newComment };
      // Для demo-режима обновляем lastSeen и updatedAt вручную
      if (this.mode === 'demo') {
        const now = new Date().toISOString();
        updated.lastSeen = now;
        (updated as any).updatedAt = now;
      } else {
        // Для server-режима удаляем lastSeen, чтобы сервер выставил новое значение
        if ('lastSeen' in updated) delete updated.lastSeen;
      }
      try {
        const { showLoading, hideLoading } = await import('./utils/loading');
        showLoading(saveBtn, 'save');

        try {
          const api = this.errorApi;
          if (!api) {
            console.warn('Модальное окно: errorApi не инициализирован, невозможно обновить ошибку');
          } else {
            await api.updateError(error.id, updated);
          }
          this.close();
          if (window.errorTableInstance && typeof window.errorTableInstance.fetchErrors === 'function') {
            window.errorTableInstance.fetchErrors();
          }
          setTimeout(() => hideLoading(saveBtn), 0);
        } catch (e) {
          console.error('Ошибка при сохранении изменений:', e);
          setTimeout(() => hideLoading(saveBtn), 0);
        }
      } catch (impErr) {
        handleModuleLoadError('Failed to load loading utils for save', impErr);
      }
    });

    this.modal.addEventListener('click', this._outsideClickHandler);

    setChildren(this.modalContent, [this.createCloseBtn(), title, ...rows, saveBtn]);
    // Переводим все узлы с data-i18n внутри модального окна
    translateNodes(this.modalContent, '[data-i18n]');
    this._setBackgroundInert(true);
    this.modal.classList.add('modal--open');
    document.body.classList.add('modal-open');
    this._setInitialModalFocus();
  }

  deleteError(errorId: string, _isLangChange = false): void {
    if (!this.modal || !this.modalContent) return;
    void _isLangChange;
    this._lastErrorIdForDelete = errorId;

    const deleteBtn = createElement(
      'button',
      {
        className: 'modal__delete-btn',
        id: 'deleteErrorButton',
        dataI18n: 'modalDeleteBtn',
        ariaLabel: t('modalDeleteBtn'),
      },
      t('modalDeleteBtn'),
    );
    deleteBtn.addEventListener('click', async () => {
      try {
        const { showLoading, hideLoading } = await import('./utils/loading');
        showLoading(deleteBtn, 'delete');

        const api = this.errorApi;
        if (!api) {
          console.warn('Модальное окно: errorApi не инициализирован, невозможно удалить ошибку');
          setTimeout(() => hideLoading(deleteBtn), 0);
        } else {
          api
            .deleteError(errorId)
            .then(() => {
              this.close();
              if (window.errorTableInstance && typeof window.errorTableInstance.fetchErrors === 'function') {
                window.errorTableInstance.fetchErrors();
              }
              setTimeout(() => hideLoading(deleteBtn), 0);
            })
            .catch((error) => {
              console.error('Ошибка при удалении ошибки:', error);
              setTimeout(() => hideLoading(deleteBtn), 0);
            });
        }
      } catch (impErr) {
        handleModuleLoadError('Не удалось загрузить утилиты для удаления', impErr, undefined, undefined);
      }
    });

    const cancelBtn = createElement(
      'button',
      {
        className: 'modal__cancel-btn',
        id: 'cancelDeleteButton',
        dataI18n: 'modalCancelBtn',
        ariaLabel: t('modalCancelBtn'),
      },
      t('modalCancelBtn'),
    );
    cancelBtn.addEventListener('click', () => this.close());

    // Добавляем обработчик клика по фону только при открытии
    this.modal.addEventListener('click', this._outsideClickHandler);

    setChildren(this.modalContent, [this.createCloseBtn(), createElement('h2', { className: 'modal__title', dataI18n: 'modalDeleteTitle' }, t('modalDeleteTitle')), createElement('p', { className: 'modal__message', dataI18n: 'modalDeleteMessage' }, t('modalDeleteMessage')), deleteBtn, cancelBtn]);
    // Переводим текст внутри модалки удаления
    translateNodes(this.modalContent, '[data-i18n]');
    this._setBackgroundInert(true);
    this.modal.classList.add('modal--open');
    this._setInitialModalFocus();
  }

  // Форматирование даты в стиле дд.мм.гггг чч:мм
  _formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  close(): void {
    if (this.modal) {
      this._setBackgroundInert(false);
      this.modal.classList.remove('modal--open');
      document.body.classList.remove('modal-open');
      // Удаляем обработчик клика по фону при закрытии
      this.modal.removeEventListener('click', this._outsideClickHandler);
      // Снимаем .is-open у select при закрытии модалки
      if (this.modalContent) {
        const select = this.modalContent.querySelector('.modal__status-select');
        if (select) select.classList.remove('is-open');
      }
      // Удаляем обработчик document.mousedown для кастомного select
      if (window.closeCustomSelectModal) {
        document.removeEventListener('mousedown', window.closeCustomSelectModal);
        window.closeCustomSelectModal = undefined;
      }
      // Сброс последних сохранённых ошибок для обновления
      this._lastErrorForEdit = null;
      this._lastErrorIdForDelete = null;
    }
  }
}
