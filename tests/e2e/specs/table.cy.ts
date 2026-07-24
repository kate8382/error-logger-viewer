/// <reference types="cypress" />
/// <reference path="../support/commands.d.ts" />

describe('Table of Errors', () => {
  it('открывает главную страницу и видит заголовок таблицы', () => {
    cy.intercept({ method: 'GET', url: /\/errors(\?|$)/ }, { fixture: 'errors.json' }).as('getErrorsHome');
    cy.visit('/');
    cy.wait('@getErrorsHome');
    cy.get('.error-table__title').should('be.visible');
  });

  it('рендерит строки таблицы из API', () => {
    // Перехватываем запрос за ошибками и возвращаем фикстуру
    cy.intercept('GET', '**/errors*', { fixture: 'errors.json' }).as('getErrors');
    cy.visit('/');
    cy.wait('@getErrors');
    // Ждём таблицу и проверяем строки
    cy.waitForTable();
    cy.get('#errorTableBody tr', { timeout: 20000 }).should('have.length', 2);
    cy.get('#errorTableBody').should('contain', 'err-1').and('contain', 'err-2');
  });

  it('сортирует по count (серверная сортировка) и отображает порядок', () => {
    // Универсальный перехват: для запросов с ?sort=count возвращаем отсортированную фикстуру, иначе — базовую фикстуру. Это устойчивее к порядку регистрации интерсептов и к вариантам query string (order, offset и т.д.).
    cy.intercept({ method: 'GET', url: '**/errors*' }, (req) => {
      const qSort = (req.query && (req.query as any).sort) || undefined;
      if (qSort === 'count' || (req.url && req.url.includes('sort=count'))) {
        req.reply({ fixture: 'errors_sorted_count_asc.json' });
      } else {
        req.reply({ fixture: 'errors.json' });
      }
    }).as('getErrors');

    cy.visit('/');
    cy.wait('@getErrors');

    // Кликаем по кнопке сортировки и ждём сетевой вызов сортировки
    cy.get('#sortByCount').click();
    cy.wait('@getErrors');
    // Ждём перерендера таблицы и проверяем порядок строк — используем `should` для автоповтора
    cy.waitForTable();
    cy.get('#errorTableBody tr', { timeout: 20000 }).should(($rows: JQuery<HTMLElement>) => {
      const ids = $rows.map((i, el) => Cypress.$(el).find('td').first().text().trim()).get();
      expect(ids).to.deep.equal(['err-2', 'err-1']);
    });
  });

  it('показывает модальное окно при нажатии Delete (открытие модалки)', () => {
    // Перехватываем начальный список
    cy.intercept('GET', '**/errors*', { fixture: 'errors.json' }).as('getErrorsInit2');

    cy.visit('/');
    cy.wait('@getErrorsInit2');
    // Ждём рендер таблицы и используем helper для первой строки
    cy.waitForTable();
    cy.openRowActions(0);
    cy.getFirstRow().find('.error-table__btn--delete').click({ force: true });

    // Ждём появления кнопки удаления в модалке (dynamic import + рендер модалки может быть асинхронным)
    cy.get('#deleteErrorButton', { timeout: 20000 }).should('exist');
  });
});
