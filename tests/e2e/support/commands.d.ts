/// <reference types="cypress" />

// Локальная декларация для е2е тестов с кастомными командами для удобства тестов, например, открытие настроек, взаимодействие с таблицами и т.д.
// эти команды будут использоваться в тестах для упрощения и повышения читаемости, а также для повторного использования логики взаимодействия с UI
// используем модульную структуру и типизацию для лучшей поддержки и автодополнения в редакторе
declare namespace Cypress {
  interface Chainable<Subject = any> {
      openSettings(): Chainable<void>;
      openSettingsGroup(group: string): Chainable<void>;
      waitForTable(options?: { timeout?: number }): Chainable<JQuery<HTMLElement>>;
      getFirstRow(): Chainable<JQuery<HTMLElement>>;
      clickSettingsOption(group: string, value: string, opts?: { force?: boolean }): Chainable<void>;
      openRowActions(index?: number): Chainable<JQuery<HTMLElement>>;
      confirmDelete(): Chainable<void>;
    }
  }

