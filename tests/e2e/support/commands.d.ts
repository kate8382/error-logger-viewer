/// <reference types="cypress" />
// локальная декларация только для E2E команд Cypress, которые добавлены в tests/e2e/support/commands.ts
declare namespace Cypress {
  interface Chainable<Subject = any> {
    /** Открывает основной выпадающий список настроек */
    openSettings(): Chainable<any>;

    /** Открывает группу настроек по ключу */
    openSettingsGroup(group: string): Chainable<any>;

    /** Клик по опции в группе настроек */
    clickSettingsOption(group: string, value: string, opts?: { force?: boolean }): Chainable<any>;

    /** Ожидает рендер таблицы ошибок */
    waitForTable(options?: { timeout?: number }): Chainable<JQuery<HTMLElement>>;

    /** Возвращает первую строку таблицы */
    getFirstRow(): Chainable<JQuery<HTMLTableRowElement>>;

    /** Открыть меню действий строки по индексу */
    openRowActions(index?: number): Chainable<any>;

    /** Подтвердить удаление в модалке */
    confirmDelete(): Chainable<any>;
  }
}
