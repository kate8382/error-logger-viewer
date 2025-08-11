import { el, setChildren } from 'redom';
import { translations } from './i18n.js';
import { ErrorApi } from './api.js';

export class Modal {
  constructor() {
    if (Modal._instance) {
      return Modal._instance;
    }
    this.errorApi = new ErrorApi();
    this.translations = translations;
    // Определяем актуальный язык
    // Язык будет определяться динамически при открытии модалки

    this.modal = document.getElementById('modal');
    this.modalContent = document.getElementById('modalContent');
    if (!this.modal || !this.modalContent) {
      console.error('Modal elements not found in the document');
      return;
    }
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

  getCurrentLang() {
    return (window.app && window.app.lang) ? window.app.lang : ((navigator.language || navigator.userLanguage).startsWith('ru') ? 'ru' : 'en');
  }

  createCloseBtn() {
    const closeBtn = el('span', { className: 'modal__close', 'aria-hidden': 'true' }, '×');
    closeBtn.addEventListener('click', () => this.close());
    return closeBtn;
  }

  openEdit(error) {
    if (!this.modal || !this.modalContent) return;

    const lang = this.getCurrentLang();
    const typeLabel = this.translations[lang]['modalField_type'] || 'Type';
    const idLabel = this.translations[lang]['modalField_id'] || 'ID';
    const dateLabel = this.translations[lang]['modalField_date'] || 'Date';
    const updatedAtLabel = this.translations[lang]['modalField_updatedAt'] || 'Updated At';
    const messageLabel = this.translations[lang]['modalField_message'] || 'Message';
    const sourceLabel = this.translations[lang]['modalField_source'] || 'Source';
    const stackLabel = this.translations[lang]['modalField_stack'] || 'Stack';
    const statusLabel = this.translations[lang]['modalField_status'] || 'Status';
    const commentLabel = this.translations[lang]['modalField_comment'] || 'Comment';

    const title = el('h2', { className: 'modal__title', id: 'modalTitle', 'data-i18n': 'modalTitle' }, this.translations[lang]['modalTitle'] || 'Error Details');

    const type = error.type || '';
    const id = error.id || '';
    let dateValue = '';
    if (error.timestamp) {
      dateValue = new Date(error.timestamp).toLocaleString();
    } else if (error.createdAt) {
      dateValue = new Date(error.createdAt).toLocaleString();
    }
    // updatedAt: показываем, если есть
    const hasUpdatedAt = Boolean(error.updatedAt);
    const updatedAt = hasUpdatedAt ? new Date(error.updatedAt).toLocaleString() : '';
    const message = error.message || '';
    const comment = error.comment || '';
    const statusOptions = [
      { value: 'new', label: this.translations[lang]['new'] || 'Новая' },
      { value: 'in_progress', label: this.translations[lang]['in_progress'] || 'В работе' },
      { value: 'fixed', label: this.translations[lang]['fixed'] || 'Исправлена' },
      { value: 'ignored', label: this.translations[lang]['ignored'] || 'Игнорировать' }
    ];
    let currentStatus = statusOptions.find(opt => opt.value === error.status);
    if (!currentStatus) currentStatus = statusOptions[0];
    // Кастомный select для статуса
    const statusSelect = el('div', { className: 'modal__status-select is-close' }, [
      el('span', { className: 'modal__status-current' }, currentStatus.label),
      el('span', { className: 'modal__status-arrow' }),
      el('ul', { className: 'modal__status-list', style: 'display: none;' },
        ...statusOptions
          .filter(opt => opt.value !== currentStatus.value)
          .map(opt => el('li', { 'data-value': opt.value, className: 'modal__status-option' }, opt.label))
      )
    ]);
    const currentSpan = statusSelect.querySelector('.modal__status-current');
    const list = statusSelect.querySelector('.modal__status-list');
    // Обработчик для закрытия по клику вне select
    function closeCustomSelect(e) {
      if (!statusSelect.contains(e.target)) {
        statusSelect.classList.remove('is-open');
        statusSelect.classList.add('is-close');
        list.style.display = 'none';
        document.removeEventListener('mousedown', closeCustomSelect);
      }
    }
    statusSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (statusSelect.classList.contains('is-open')) {
        statusSelect.classList.remove('is-open');
        statusSelect.classList.add('is-close');
        list.style.display = 'none';
        document.removeEventListener('mousedown', closeCustomSelect);
      } else {
        statusSelect.classList.add('is-open');
        statusSelect.classList.remove('is-close');
        list.style.display = 'block';
        document.addEventListener('mousedown', closeCustomSelect);
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

    // Остальные поля (только для просмотра)
    const exclude = ['type', 'id', 'timestamp', 'createdAt', 'updatedAt', 'message', 'status', 'comment'];
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
          label = this.translations[lang][labelKey] || (key.charAt(0).toUpperCase() + key.slice(1));
        }
        return el('div', { className: 'modal__row' }, [
          el('span', { className: 'modal__field-title' }, label + ': '),
          el('span', { className: 'modal__field-value' }, value)
        ]);
      });

    const rows = [
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, typeLabel + ': '),
        el('span', { className: 'modal__field-value' }, type)
      ]),
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, idLabel + ': '),
        el('span', { className: 'modal__field-value' }, id)
      ]),
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, dateLabel + ': '),
        el('span', { className: 'modal__field-value' }, dateValue)
      ]),
      ...(hasUpdatedAt ? [el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, updatedAtLabel + ': '),
        el('span', { className: 'modal__field-value' }, updatedAt)
      ])] : []),
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

    const saveBtn = el('button', { className: 'modal__button', id: 'saveModalButton', 'data-i18n': 'modalSaveBtn', 'aria-label': this.translations[lang]['modalSaveBtn'] || 'Save' }, this.translations[lang]['modalSaveBtn'] || 'Save');
    saveBtn.addEventListener('click', async () => {
      const newStatus = currentStatus.value;
      const newComment = commentArea.value;
      const updated = { ...error, status: newStatus, comment: newComment };
      try {
        await this.errorApi.updateError(error.id, updated);
        this.close();
        // Обновляем таблицу ошибок после сохранения
        const table = document.querySelector('.error-table');
        if (table) {
          table.dispatchEvent(new Event('update'));
        }
      } catch (e) {
        console.error('Ошибка при сохранении изменений:', e);
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
  }

  deleteError(errorId) {
    if (!this.modal || !this.modalContent) return;

    const lang = this.getCurrentLang();
    const deleteBtn = el('button', { className: 'modal__delete-btn', id: 'deleteErrorButton', 'data-i18n': 'modalDeleteBtn', 'aria-label': this.translations[lang]['modalDeleteBtn'] || 'Delete' }, this.translations[lang]['modalDeleteBtn'] || 'Delete');
    deleteBtn.addEventListener('click', () => {
      this.errorApi.deleteError(errorId).then(() => {
        this.close();
        // Обновляем таблицу ошибок после удаления
        const table = document.querySelector('.error-table');
        if (table) {
          table.dispatchEvent(new Event('update'));
        }
      }).catch(error => {
        console.error('Ошибка при удалении ошибки:', error);
      });
    });

    const cancelBtn = el('button', { className: 'modal__cancel-btn', id: 'cancelDeleteButton', 'data-i18n': 'modalCancelBtn', 'aria-label': this.translations[lang]['modalCancelBtn'] || 'Cancel' }, this.translations[lang]['modalCancelBtn'] || 'Cancel');
    cancelBtn.addEventListener('click', () => this.close());

    // Добавляем обработчик клика по фону только при открытии
    this.modal.addEventListener('click', this._outsideClickHandler);

    setChildren(this.modalContent, [
      this.createCloseBtn(),
      el('h2', { className: 'modal__title', 'data-i18n': 'modalDeleteTitle' }, this.translations[lang]['modalDeleteTitle'] || 'Delete Error'),
      el('p', { className: 'modal__message', 'data-i18n': 'modalDeleteMessage' }, this.translations[lang]['modalDeleteMessage'] || 'Are you sure you want to delete this error?'),
      deleteBtn,
      cancelBtn
    ]);
    this.modal.classList.add('modal--open');
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('modal--open');
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
    }
  }
}
