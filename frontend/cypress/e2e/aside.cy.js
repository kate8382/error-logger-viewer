/* eslint-env cypress */

describe('Aside navigation', () => {
  beforeEach(() => {
    cy.visit('http://192.168.31.198:8080/');
  });

  it('переходит по разделам навигации', () => {
    cy.contains('О программе').click();
    cy.get('#aboutSection').should('be.visible');

    cy.contains('Статистика ошибок').click();
    cy.get('#errorStats').should('be.visible');

    cy.contains('Графики ошибок').click();
    cy.get('#errorsChart').should('be.visible');

    cy.contains('Таблица ошибок').click();
    cy.get('#errorTableSection').should('be.visible');
  });

  it('открывает выпадающий список настроек', () => {
    cy.get('.sidebar__dropdown-btn').click();
    cy.get('#sidebarDropdownList').should('be.visible');
  });

  it('меняет язык на английский и обратно', () => {
    cy.get('.sidebar__dropdown-btn').click(); // Открыть настройки
    cy.get('.sidebar__dropdown-group-btn[data-group="language"]').click(); // Открыть группу «Язык»
    cy.get('.sidebar__dropdown-sublist[data-group="language"]').should('be.visible'); // Проверить, что подлист виден
    cy.contains('English').click(); // Клик по «English»
    cy.contains('Error Chart'); // Проверка, что заголовок на английском

    cy.get('.sidebar__dropdown-btn').click();
    cy.get('.sidebar__dropdown-group-btn[data-group="language"]').click();
    cy.get('.sidebar__dropdown-sublist[data-group="language"]').should('be.visible');
    cy.contains('Русский').click();
    cy.contains('Таблица ошибок'); // Проверка, что заголовок на русском
  });

  it('меняет тему на тёмную и обратно', () => {
    cy.get('.sidebar__dropdown-btn').click(); // Открыть настройки
    cy.get('.sidebar__dropdown-group-btn[data-group="theme"]').click(); // Открыть группу «Тема»
    cy.get('.sidebar__dropdown-sublist[data-group="theme"]').should('be.visible'); // Проверить, что подменю видно
    cy.contains('Dark').click(); // Клик по «Dark»
    cy.get('body').should('have.class', 'theme-dark');

    cy.get('.sidebar__dropdown-btn').click();
    cy.get('.sidebar__dropdown-group-btn[data-group="theme"]').click();
    cy.get('.sidebar__dropdown-sublist[data-group="theme"]').should('be.visible');
    cy.contains('Light').click();
    cy.get('body').should('not.have.class', 'theme-dark');
  });
});