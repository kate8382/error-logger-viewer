/* eslint-env cypress */
/* global Cypress, cy */
// For more comprehensive examples of custom commands please read more here:
// https://on.cypress.io/custom-commands

// Открыть основной выпадающий список настроек (Settings) в сайдбаре
Cypress.Commands.add('openSettings', () => {
  cy.get('.sidebar__dropdown').then($d => {
    if (!$d.hasClass('open')) {
      cy.wrap($d).find('.sidebar__dropdown-btn').click();
    }
  });
  cy.get('.sidebar__dropdown').should('have.class', 'open');
});

// Открыть конкретную группу настроек внутри списка (например, 'language' или 'theme')
Cypress.Commands.add('openSettingsGroup', (group) => {
  cy.openSettings();
  cy.get(`.sidebar__dropdown-group-btn[data-group="${group}"]`).scrollIntoView().click();
  cy.get(`.sidebar__dropdown-sublist[data-group="${group}"]`).should('exist');
});


// Ожидать, что таблица ошибок (tbody) будет отрисована
// options: { timeout } - время ожидания в ms (по умолчанию 20000)
Cypress.Commands.add('waitForTable', (options = {}) => {
  const { timeout = 20000 } = options;
  // Ждём появления tbody. Тесты могут дополнительно проверять количество строк
  return cy.get('#errorTableBody', { timeout }).should('exist');
});

// Вернуть первую строку таблицы (tr) как цепочку Cypress
Cypress.Commands.add('getFirstRow', () => {
  return cy.get('#errorTableBody').find('tr').first();
});

// Нажать опцию в группе настроек: language, theme и т.п.
// clickSettingsOption(group, value, { force: false })
Cypress.Commands.add('clickSettingsOption', (group, value, opts = {}) => {
  const { force = false } = opts;
  cy.openSettings();
  cy.openSettingsGroup(group);
  const sel = `.sidebar__dropdown-sublist[data-group="${group}"] .sidebar__dropdown-option[data-value="${value}"]`;
  // Иногда подсписок скрыт CSS-анимацией — пробуем прокрутить и кликнуть; при необходимости передаём force
  return cy.get(sel).scrollIntoView().click({ force });
});




