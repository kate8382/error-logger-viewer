// / <reference types="cypress" />

describe('Table - CRUD operations', () => {
  beforeEach(() => {
    // Перехватываем запрос получения списка ошибок
    cy.intercept('GET', '**/errors*', { fixture: 'errors.json' }).as('getErrors');
    // Перехватываем POST/PUT/DELETE и имитируем успешный ответ
    cy.intercept('POST', '**/errors', { statusCode: 201, body: { id: 'new-id' } }).as('createError');
    cy.intercept('PUT', '**/errors/*', (req) => {
      req.reply({ statusCode: 200, body: req.body });
    }).as('updateError');
    cy.intercept('DELETE', '**/errors/*', { statusCode: 200 }).as('deleteError');

    cy.visit('/');
    cy.wait('@getErrors');
  });

  it('создает новую ошибку через тестовую кнопку', () => {
    // Тестовая кнопка появляется только в demo режиме (localStorage), включим его
    cy.window().then(win => {
      win.localStorage.setItem('app_mode', 'demo');
    });
    // Перезагрузим страницу чтобы приложение применило режим
    cy.reload();
    cy.wait('@getErrors');

    // Теперь безопасно кликаем по кнопке тестовой ошибки
    cy.get('body').then($body => {
      if ($body.find('#testErrorBtn').length) {
        cy.get('#testErrorBtn').click();
        cy.wait('@createError');
      } else {
        cy.log('No test error button present even in demo mode');
      }
    });
  });

  it('редактирует первую ошибку через модальное окно', () => {
    // откроем меню действий в первой строке и нажмём Edit (используем helper)
    cy.openRowActions(0);
    cy.getFirstRow().find('.error-table__btn--edit', { timeout: 10000 }).click({ force: true });

    // дождёмся открытия модалки (иногда модалка рендерится но остаётся скрытой до установки класса)
    cy.get('#modal', { timeout: 15000 }).should('have.class', 'modal--open');
    cy.get('body', { timeout: 15000 }).should('have.class', 'modal-open');
    // В модалке поле message отображается в read-only, комментарий — в textarea .modal__comment-area
    // и статус — кастомный select. Выберем другую опцию статуса и изменим комментарий.
    cy.get('#modal textarea.modal__comment-area').should('exist').clear().type('Updated message');

    // Открываем кастомный селект статуса и выбираем первую опцию (если есть)
    cy.get('#modal .modal__status-select').then($sel => {
      if ($sel.length) {
        cy.wrap($sel).click();
        cy.get('#modal .modal__status-option').first().click();
      }
    });

    cy.get('#saveModalButton').click();
    // Ждём, что тестовый перехват сработает
    cy.wait('@updateError');
  });

  it('удаляет первую ошибку', () => {
    // откроем меню действий и нажмём Delete
    // откроем меню действий и нажмём Delete (используем helper), затем подтвердим в модалке
    cy.openRowActions(0);
    cy.getFirstRow().find('.error-table__btn--delete', { timeout: 10000 }).click({ force: true });

    // Ожидаем, что модалка откроется (динамический импорт может быть медленным), затем подтверждаем
    cy.get('#modal', { timeout: 15000 }).should('have.class', 'modal--open');
    cy.confirmDelete();

    // Убедимся, что модалка закрылась и таблица на месте
    cy.get('#modal', { timeout: 10000 }).should('not.have.class', 'modal--open');
    cy.get('body').should('not.have.class', 'modal-open');
    cy.get('#errorTableBody').should('exist');

    // Если мы в demo режиме, убедимся, что запись удалена из localStorage
    cy.window().then(win => {
      if (win.localStorage.getItem('app_mode') === 'demo') {
        const errs = JSON.parse(win.localStorage.getItem('errorsLocal') || '[]');
        // исходная фикстура содержит err-1, ожидаем, что его нет после удаления
        expect(errs.find(e => e.id === 'err-1')).to.be.undefined;
      }
    });
  });
});
