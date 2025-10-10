import { el, setChildren } from 'redom';
import { ErrorApi } from './api.js';
import { t, getLabel, onLangChange } from './utils/i18n.js';

export class Modal {
  constructor(mode = 'server') {
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
    this.modal = document.getElementById('modal');
    this.modalContent = document.getElementById('modalContent');
    if (!this.modal || !this.modalContent) return;

    this.modalClose = document.querySelectorAll('.modal__close');
    Array.from(this.modalClose).forEach(closeBtn => {
      closeBtn.addEventListener('click', () => this.close());
    });

    // Глобальный обработчик Escape
    this.addedEsc = false;
    this.addEscListener();

    // Для клика по фону — обработчик будет добавляться/удаляться при открытии/закрытии
    this._outsideClickHandler = (event) => {
      if (event.target === this.modal) {
        this.close();
      }
    };

    Modal._instance = this;
  }

  addEscListener() {
    if (!this.addedEsc) {
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          this.close();
        }
      });
      this.addedEsc = true;
    }
  }

  createCloseBtn() {
    const closeBtn = el('span', { className: 'modal__close', 'aria-hidden': 'true' }, '×');
    closeBtn.addEventListener('click', () => this.close());
    return closeBtn;
  }

  openEdit(error) {
    if (!this.modal || !this.modalContent) return;
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

    const title = el('h2', { className: 'modal__title', id: 'modalTitle', 'data-i18n': 'modalTitle' }, t('modalTitle'));

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
    const comment = error.comment || '';
    const statusOptions = [
      { value: 'new', label: t('new') },
      { value: 'in_progress', label: t('in_progress') },
      { value: 'fixed', label: t('fixed') },
      { value: 'ignored', label: t('ignored') }
    ];
    let currentStatus = statusOptions.find(opt => opt.value === error.status);
    if (!currentStatus) currentStatus = statusOptions[0];
    // Универсальный select для всех статусов
    let statusSelect = el('div', { className: 'modal__status-select is-close' }, [
      el('span', { className: 'modal__status-current' }, currentStatus.label),
      // Вставляем SVG через innerHTML, как в aside
      (() => {
        const svg = document.createElement('span');
        svg.innerHTML = '<svg class="modal__status-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5.4975L2.12175 3.375L9.003 10.3792L15.8783 3.375L18 5.4975L9.003 14.625L0 5.4975Z" fill="currentColor"/></svg>';
        return svg.firstChild;
      })(),
      el('ul', { className: 'modal__status-list', style: 'display: none;' },
        ...statusOptions
          .filter(opt => opt.value !== currentStatus.value)
          .map(opt => el('li', { 'data-value': opt.value, className: 'modal__status-option' }, opt.label))
      )
    ]);
    const currentSpan = statusSelect.querySelector('.modal__status-current');
    const list = statusSelect.querySelector('.modal__status-list');

    // Вынесено в приватный метод класса
    this._closeCustomSelect = (e) => {
      if (!statusSelect.contains(e.target)) {
        statusSelect.classList.remove('is-open');
        statusSelect.classList.add('is-close');
        list.style.display = 'none';
        document.removeEventListener('mousedown', this._closeCustomSelect);
      }
    };
    statusSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (statusSelect.classList.contains('is-open')) {
        statusSelect.classList.remove('is-open');
        statusSelect.classList.add('is-close');
        list.style.display = 'none';
        document.removeEventListener('mousedown', this._closeCustomSelect);
      } else {
        statusSelect.classList.add('is-open');
        statusSelect.classList.remove('is-close');
        list.style.display = 'block';
        document.addEventListener('mousedown', this._closeCustomSelect);
      }
    });
    // Выбор опции
    list.addEventListener('click', (e) => {
      if (e.target && e.target.matches('li')) {
        const value = e.target.getAttribute('data-value');
        const label = e.target.textContent;
        currentStatus = statusOptions.find(opt => opt.value === value) || statusOptions[0];
        currentSpan.textContent = label;
        // Пересоздать список без выбранной опции
        list.innerHTML = '';
        statusOptions.filter(opt => opt.value !== currentStatus.value)
          .forEach(opt => {
            const li = el('li', { 'data-value': opt.value, className: 'modal__status-option' }, opt.label);
            list.appendChild(li);
          });
        // закрыть список
        statusSelect.classList.remove('is-open');
        statusSelect.classList.add('is-close');
        list.style.display = 'none';
      }
    });
    // Escape — закрыть
    statusSelect.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        statusSelect.classList.remove('is-open');
        statusSelect.classList.add('is-close');
        list.style.display = 'none';
      }
    });

    const commentArea = el('textarea', { className: 'modal__comment-area', rows: 3, placeholder: `${commentLabel} ...` }, comment);

    // Обработчик событий Enter для сохранения комментария
    commentArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveBtn.click();
      }
    });

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
          label = t(labelKey) || (key.charAt(0).toUpperCase() + key.slice(1));
        }
        return el('div', { className: 'modal__row' }, [
          el('span', { className: 'modal__field-title' }, label + ': '),
          el('span', { className: 'modal__field-value' }, value)
        ]);
      });

    const rows = [
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, typeLabel + ': '),
        el('span', { className: 'modal__field-value', 'data-type': error.type }, type)
      ]),
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, idLabel + ': '),
        el('span', { className: 'modal__field-value' }, id)
      ]),
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, firstSeenLabel + ': '),
        el('span', { className: 'modal__field-value' }, firstSeenValue)
      ]),
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, lastSeenLabel + ': '),
        el('span', { className: 'modal__field-value' }, lastSeenValue)
      ]),
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, countLabel + ': '),
        el('span', { className: 'modal__field-value' }, countValue)
      ]),
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, usersLabel + ': '),
        el('span', { className: 'modal__field-value' }, usersValue)
      ]),
      ...otherRows,
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, messageLabel + ': '),
        el('span', { className: 'modal__field-value' }, message)
      ]),
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, statusLabel + ': '),
        statusSelect
      ]),
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, commentLabel + ': '),
        commentArea
      ])
    ];

    const saveBtn = el('button', { className: 'modal__button', id: 'saveModalButton', 'data-i18n': 'modalSaveBtn', 'aria-label': t('modalSaveBtn') }, t('modalSaveBtn'));
    saveBtn.addEventListener('click', async () => {
      const newStatus = currentStatus.value;
      const newComment = commentArea.value;
      const updated = { ...error, status: newStatus, comment: newComment };
      // Для demo-режима обновляем lastSeen и updatedAt вручную
      if (this.mode === 'demo') {
        const now = new Date().toISOString();
        updated.lastSeen = now;
        updated.updatedAt = now;
      } else {
        // Для server-режима удаляем lastSeen, чтобы сервер выставил новое значение
        if ('lastSeen' in updated) delete updated.lastSeen;
      }
      const { showLoading, hideLoading } = await import('./utils/loading');
      showLoading(saveBtn, 'save');

      try {
        await this.errorApi.updateError(error.id, updated);
        this.close();
        if (window.errorTableInstance && typeof window.errorTableInstance.fetchErrors === 'function') {
          window.errorTableInstance.fetchErrors();
        }
        hideLoading(saveBtn);
      } catch (e) {
        console.error('Ошибка при сохранении изменений:', e);
        hideLoading(saveBtn);
      }
    });

    this.modal.addEventListener('click', this._outsideClickHandler);

    setChildren(this.modalContent, [
      this.createCloseBtn(),
      title,
      ...rows,
      saveBtn
    ]);

    this.modal.classList.add('modal--open');
    document.body.classList.add('modal-open');
  }

  deleteError(errorId) {
    if (!this.modal || !this.modalContent) return;
    this._lastErrorIdForDelete = errorId;

    const deleteBtn = el('button', { className: 'modal__delete-btn', id: 'deleteErrorButton', 'data-i18n': 'modalDeleteBtn', 'aria-label': t('modalDeleteBtn') }, t('modalDeleteBtn'));
    deleteBtn.addEventListener('click', async () => {
      const { showLoading, hideLoading } = await import('./utils/loading');
      showLoading(deleteBtn, 'delete');

      this.errorApi.deleteError(errorId).then(() => {
        this.close();
        if (window.errorTableInstance && typeof window.errorTableInstance.fetchErrors === 'function') {
          window.errorTableInstance.fetchErrors();
        }
        hideLoading(deleteBtn);
      }).catch(error => {
        console.error('Ошибка при удалении ошибки:', error);
        hideLoading(deleteBtn);
      });
    });

    const cancelBtn = el('button', { className: 'modal__cancel-btn', id: 'cancelDeleteButton', 'data-i18n': 'modalCancelBtn', 'aria-label': t('modalCancelBtn') }, t('modalCancelBtn'));
    cancelBtn.addEventListener('click', () => this.close());

    // Добавляем обработчик клика по фону только при открытии
    this.modal.addEventListener('click', this._outsideClickHandler);

    setChildren(this.modalContent, [
      this.createCloseBtn(),
      el('h2', { className: 'modal__title', 'data-i18n': 'modalDeleteTitle' }, t('modalDeleteTitle')),
      el('p', { className: 'modal__message', 'data-i18n': 'modalDeleteMessage' }, t('modalDeleteMessage')),
      deleteBtn,
      cancelBtn
    ]);
    this.modal.classList.add('modal--open');
  }
  // Форматирование даты в стиле дд.мм.гггг чч:мм
  _formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('modal--open');
      document.body.classList.remove('modal-open');
      // Удаляем обработчик клика по фону при закрытии
      this.modal.removeEventListener('click', this._outsideClickHandler);
      // Снимаем .is-open у select при закрытии модалки
      const select = this.modalContent.querySelector('.modal__status-select');
      if (select) select.classList.remove('is-open');
      // Удаляем обработчик document.mousedown для кастомного select
      if (window.closeCustomSelectModal) {
        document.removeEventListener('mousedown', window.closeCustomSelectModal);
        window.closeCustomSelectModal = null;
      }
      // Сброс последних сохранённых ошибок для обновления
      this._lastErrorForEdit = null;
      this._lastErrorIdForDelete = null;
    }
  }
}
