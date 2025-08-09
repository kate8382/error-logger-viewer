import { el, setChildren } from 'redom';
import { translations } from './i18n.js';
import { ErrorApi } from './api.js';

export class Modal {
  constructor() {
    this.errorApi = new ErrorApi();
    this.translations = translations;
    // Определяем актуальный язык
    this.lang = (window.app && window.app.lang) ? window.app.lang : ((navigator.language || navigator.userLanguage).startsWith('ru') ? 'ru' : 'en');

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
  }

  createCloseBtn() {
    const closeBtn = el('span', { className: 'modal__close', 'aria-hidden': 'true' }, '×');
    closeBtn.addEventListener('click', () => this.close());
    return closeBtn;
  }

  open(error) {
    if (!this.modal || !this.modalContent) return;


    // Заголовки для полей из переводов
    const typeLabel = this.translations[this.lang]['modalType'] || 'Type';
    const idLabel = this.translations[this.lang]['modalId'] || 'ID';
    const dateLabel = this.translations[this.lang]['modalDate'] || 'Date';
    const messageLabel = this.translations[this.lang]['modalMessage'] || 'Message';

    // Заголовок
    const title = el('h2', { className: 'modal__title', id: 'modalTitle', 'data-i18n': 'modalTitle' }, this.translations[this.lang]['modalTitle'] || 'Error Details');

    // Определяем значения для вывода
    const type = error.type || '';
    const id = error.id || '';
    let dateValue = '';
    if (error.timestamp) dateValue = new Date(error.timestamp).toLocaleString();
    else if (error.createdAt) dateValue = new Date(error.createdAt).toLocaleString();
    const message = error.message || '';

    // Собираем остальные поля (кроме type, id, timestamp, createdAt, message, updatedAt, объектов)
    const exclude = ['type', 'id', 'timestamp', 'createdAt', 'message', 'updatedAt'];
    const otherRows = Object.entries(error)
      .filter(([key, value]) => !exclude.includes(key) && typeof value !== 'object')
      .map(([key, value]) => {
        // Используем перевод, если есть, иначе делаем заголовок с большой буквы
        const labelKey = 'modalField_' + key;
        const label = this.translations[this.lang][labelKey] || (key.charAt(0).toUpperCase() + key.slice(1));
        return el('div', { className: 'modal__row' }, [
          el('span', { className: 'modal__field-title' }, label + ': '),
          el('span', { className: 'modal__field-value' }, value)
        ]);
      });

    // Формируем поля в нужном порядке
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
      ...otherRows,
      el('div', { className: 'modal__row' }, [
        el('span', { className: 'modal__field-title' }, messageLabel + ': '),
        el('span', { className: 'modal__field-value' }, message)
      ])
    ];

    // Кнопка закрытия (нижняя)
    const closeModalBtn = el('button', { className: 'modal__button', id: 'closeModalButton', 'data-i18n': 'modalCloseBtn', 'aria-label': this.translations[this.lang]['modalCloseBtn'] || 'Close' }, this.translations[this.lang]['modalCloseBtn'] || 'Close');
    closeModalBtn.addEventListener('click', () => this.close());
    // Добавляем обработчик для закрытия по ESC
    document.addEventListener('keydown', (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (event.key === 'Escape') {
        this.close();
      }
    });
    // Обработчик для закрытия по клику вне модального окна
    this.modal.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (event.target === this.modal) {
        this.close();
      }
    });
    // Вставляем всё в modalContent
    setChildren(this.modalContent, [
      this.createCloseBtn(),
      title,
      ...rows,
      closeModalBtn
    ]);

    this.modal.classList.add('modal--open');
  }

  deleteError(errorId) {
    if (!this.modal || !this.modalContent) return;

    const deleteBtn = el('button', { className: 'modal__delete-button', id: 'deleteErrorButton', 'data-i18n': 'modalDeleteBtn', 'aria-label': this.translations[this.lang]['modalDeleteBtn'] || 'Delete' }, this.translations[this.lang]['modalDeleteBtn'] || 'Delete');
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

    const cancelBtn = el('button', { className: 'modal__button', id: 'cancelDeleteButton', 'data-i18n': 'modalCancelBtn', 'aria-label': this.translations[this.lang]['modalCancelBtn'] || 'Cancel' }, this.translations[this.lang]['modalCancelBtn'] || 'Cancel');
    cancelBtn.addEventListener('click', () => this.close());

    setChildren(this.modalContent, [
      this.createCloseBtn(),
      el('h2', { className: 'modal__title', 'data-i18n': 'modalDeleteTitle' }, this.translations[this.lang]['modalDeleteTitle'] || 'Delete Error'),
      el('p', { className: 'modal__message', 'data-i18n': 'modalDeleteMessage' }, this.translations[this.lang]['modalDeleteMessage'] || 'Are you sure you want to delete this error?'),
      deleteBtn,
      cancelBtn
    ]);
    this.modal.classList.add('modal--open');
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('modal--open');
    }
  }
}
