import type { ErrorItem } from 'errors';
import { Modal } from '../../frontend/src/scripts/modal';
import { qs, assertExists } from '../../frontend/src/scripts/utils/dom';

describe('Modal', () => {
  let modalInstance: Modal;

  beforeEach(() => {
    // минимальная разметка модального окна
    document.body.innerHTML = `
      <div id="modal" class="modal">
        <div id="modalContent" class="modal__content"></div>
      </div>
    `;
    // Убедитесь, что синглтон сброшен между тестами, чтобы конструктор привязывался к текущему DOM
    Modal._instance = null;
    modalInstance = new Modal('demo');
  });

  afterEach(() => {
    if (modalInstance && typeof modalInstance.close === 'function') modalInstance.close();
    document.body.innerHTML = '';
    // очистка глобальных обработчиков
    {
      // приводим window к локальному типу с closeCustomSelectModal (исправления как в modal.ts)
      const w = window as Window & { closeCustomSelectModal?: ((e?: MouseEvent) => void) | undefined };
      if (w.closeCustomSelectModal) {
        document.removeEventListener('mousedown', w.closeCustomSelectModal);
        w.closeCustomSelectModal = undefined;
      }
    }
  });

  it(' открывает и отображает содержимое с кнопкой сохранения и выбором статуса', () => {
    const error = {
      id: 'err-1',
      type: 'TypeError',
      message: 'boom',
      count: 1,
      firstSeen: '2025-01-01T10:00:00.000Z',
      lastSeen: '2025-01-02T11:00:00.000Z',
      users: ['a@a.com'],
      status: 'new',
      comment: 'ok',
    };

    modalInstance.openEdit(error as ErrorItem);

    const modalEl = assertExists(qs<HTMLElement>('#modal'));
    expect(modalEl.classList.contains('modal--open')).toBe(true);

    const saveBtn = assertExists(qs<HTMLElement>('#saveModalButton'));
    expect(saveBtn).toBeTruthy();

    const statusSelect = assertExists(qs<HTMLElement>('.modal__status-select'));
    expect(statusSelect).toBeTruthy();
  });

  it('переключает пользовательский выбор статуса и выбирает вариант', async () => {
    const error = { id: 'err-2', type: 'X', message: '', status: 'new' };
    modalInstance.openEdit(error);

    // дождёмся обновления DOM
    await new Promise((r) => setTimeout(r, 0));

    const statusSelect = qs<HTMLElement>('.modal__status-select');
    expect(statusSelect).toBeTruthy();
    const list = statusSelect!.querySelector('.modal__status-list') as HTMLElement | null;
    const current = statusSelect!.querySelector('.modal__status-current') as HTMLElement | null;

    // изначально закрыт (атрибут может быть не установлен до открытия)
    expect([null, 'false']).toContain(statusSelect!.getAttribute('aria-expanded'));
    expect(list!.style.display).toBe('none');

    // открывается по клику
    statusSelect!.click();
    expect(statusSelect!.getAttribute('aria-expanded')).toBe('true');
    expect(list!.style.display === 'block' || list!.style.display === '').toBe(true);

    // выбирается первый вариант
    const option = list!.querySelector('.modal__status-option') as HTMLElement | null;
    expect(option).toBeTruthy();
    const labelBefore = current!.textContent;
    option!.click();
    // после выбора текущий текст должен обновиться
    expect(current!.textContent !== labelBefore).toBe(true);
  });

  it('close()  скрывает модалку и очищает состояние', () => {
    const error = { id: 'err-3', type: 'Y', message: '', status: 'new' };
    modalInstance.openEdit(error);
    modalInstance.close();

    const modalEl = qs<HTMLElement>('#modal');
    expect(modalEl!.classList.contains('modal--open')).toBe(false);
    expect(modalInstance._lastErrorForEdit).toBeNull();
  });
});
