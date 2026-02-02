/// <reference types="cypress" />

// `AUTWindow` следует отражать реальное `window` тестируемого приложения.
// Сохраняйте фактическое расширение во время выполнения (поля, такие как `app`, `errorTableInstance`) в одном месте: `types/global.d.ts`.
// Здесь мы только делаем так, чтобы `Cypress.AUTWindow` расширял глобальный `Window`, чтобы `cy.window()` имел расширенную форму из `global.d.ts`.
declare namespace Cypress {
  interface AUTWindow extends Window {}
}
