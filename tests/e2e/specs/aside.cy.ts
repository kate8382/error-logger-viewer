// / <reference types="cypress" />

describe('Aside navigation', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', url: /\/errors(\?|$)/ }, { fixture: 'errors.json' }).as('getErrors');
    cy.visit('/');
    // Убедиться, что Aside инициализирован и навесил обработчики
    cy.window().its('aside').should('exist');
    cy.wait('@getErrors');
    // Небольшая задержка, чтобы i18n переводы применились
    cy.wait(200);
  });

  it('переходит по разделам навигации', () => {
    cy.get('[data-i18n="navAbout"]').first().click({ force: true });
    cy.get('#aboutSection').should('be.visible');

    cy.get('[data-i18n="navStats"]').first().click({ force: true });
    cy.get('#errorStats').should('be.visible');

    cy.get('[data-i18n="navCharts"]').first().click({ force: true });
    cy.get('#errorsChart').should('be.visible');

    cy.get('[data-i18n="navErrors"]').first().click({ force: true });
    cy.get('#errorTableSection').should('be.visible');
  });

  it('открывает выпадающий список настроек', () => {
    cy.openSettings();
  });

  it('меняет язык на английский и обратно', () => {
    cy.openSettings();
    // Используем helper для клика по опции языка
    cy.clickSettingsOption('language', 'en', { force: true });
    cy.get('.sidebar__item-text[data-i18n="navErrors"]').should('contain', 'Error Table');

    cy.clickSettingsOption('language', 'ru', { force: true });
    cy.get('.sidebar__item-text[data-i18n="navErrors"]').should('contain', 'Таблица ошибок');
  });

  it('меняет тему на тёмную и обратно', () => {
    cy.openSettings();
    cy.clickSettingsOption('theme', 'dark', { force: true });
    cy.get('html').should('have.attr', 'data-theme', 'dark');

    cy.clickSettingsOption('theme', 'light', { force: true });
    cy.get('html').should('have.attr', 'data-theme', 'light');
  });
});
