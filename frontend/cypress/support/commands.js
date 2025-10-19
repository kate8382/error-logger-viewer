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

// Открыть меню действий (edit/delete) для строки таблицы по индексу (по умолчанию 0)
Cypress.Commands.add('openRowActions', (index = 0) => {
  // Найти строку и кнопку выпадающего меню внутри неё
  return cy.get('#errorTableBody')
    .find('tr')
    .eq(index)
    .within(() => {
      // Ищем явную кнопку dropdown внутри ячейки действий
      cy.get('td.error-table__cell--actions').then($cell => {
        const $dropdownBtn = $cell.find('.error-table__dropdown-btn');
        if ($dropdownBtn.length) {
          cy.wrap($dropdownBtn).click({ force: true });
          return;
        }
        // Иначе кликаем по первому видимому action button (edit/delete)
        const $actionBtn = $cell.find('button.error-table__btn').first();
        if ($actionBtn.length) {
          cy.wrap($actionBtn).click({ force: true });
          return;
        }
        // Если ничего не найдено — выбрасываем ошибку для диагностики
        throw new Error('No action button found in row actions cell');
      });
    })
    .then(() => {
      // Убедимся, что меню действий раскрыто (подтверждение может зависеть от реализации)
      // Проверяем наличие кнопок edit/delete внутри строки
      return cy.get('#errorTableBody').find('tr').eq(index).should('have.descendants', 'button');
    });
});

// В модальном окне нажать кнопку подтверждения удаления и дождаться закрытия модалки
Cypress.Commands.add('confirmDelete', () => {
  // Ожидаем, что модал присутствует и содержит кнопку с id deleteErrorButton
  cy.get('#modal').should('exist').within(() => {
    cy.get('#deleteErrorButton').click({ force: true });
  });
  // После клика modal должен закрыться — ждём отсутсвия класса open или отсутствия #modal
  cy.get('#modal', { timeout: 10000 }).should('not.have.class', 'modal--open');
});
