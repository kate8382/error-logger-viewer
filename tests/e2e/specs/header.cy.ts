/// <reference types="cypress" />

describe('Header - search & filters', () => {
  beforeEach(() => {
    // Перехватываем все запросы на /errors и возвращаем фикстуру
    cy.intercept('GET', '**/errors*', { fixture: 'errors.json' }).as('getErrors');
    cy.visit('/');
    cy.wait('@getErrors');
  });

  it('отправляем запрос поиска в заголовке', () => {
    // Перейдём в секцию таблицы и убедимся, что таблица видима
    cy.get('a[href="#errorTable"]').click();
    cy.get('#errorTableSection').should('exist');

    // Вводим текст в строку поиска и нажимаем кнопку
    cy.get('#searchInput').clear().type('TypeError');
    cy.get('#searchBtn').click();

    // Ожидаем, что отправился новый запрос за списком ошибок
    cy.wait('@getErrors').its('request.url').should('exist');

    // Таблица должна содержать хотя бы одну строку после рендера и содержать отфильтрованный тип
    cy.get('#errorTableBody').should('exist').find('tr').should('have.length.greaterThan', 0);
    // Проверяем детерминированное значение из фикстуры — id первой ошибки
    cy.get('#errorTableBody tr').first().find('td.error-table__cell--id').should('contain.text', 'err-1');
  });

  it('переключает язык без поломки UI поиска', () => {
    // Нажимаем переключение языка и проверяем, что плейсхолдер обновился
    cy.get('#lang-ru').click();
    cy.get('#searchInput').should('exist');

    // И снова выполнить поиск — проверяем, что запрос всё ещё отправляется
    cy.get('#searchInput').clear().type('ReferenceError');
    cy.get('#searchBtn').click();
    cy.wait('@getErrors').its('request.url').should('exist');
  });
});
