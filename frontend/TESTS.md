TESTS — how to run tests (EN) / ТЕСТЫ — как запускать тесты (RU)

---

English
=======

This document explains how to run unit and end-to-end tests for the frontend.

Prerequisites
- Node.js (16+) and npm installed.
- Project dependencies installed in `frontend`:
  ```powershell
  cd frontend
  npm install
  ```

Unit tests (Jest)
-----------------
- Run all unit tests:
  ```powershell
  cd frontend
  npm test
  ```
- Run a single test file (example):
  ```powershell
  npm test -- src/scripts/__tests__/header.test.js
  ```
- Run in watch mode:
  ```powershell
  npm test -- --watch
  ```

Why run unit tests?
- Quick feedback on business logic changes.
- Ensures small modules behave correctly before running e2e.

End-to-end tests (Cypress)
--------------------------
Cypress tests interact with a running frontend application. You must start the dev server first.

1) Start dev server in one terminal:
```powershell
cd frontend
npm run start
```
The app is usually available at http://localhost:8080. If your dev server uses a different host/port, see the "Troubleshooting" section.

2) Open Cypress (interactive):
```powershell
cd frontend
npx cypress open --config baseUrl="http://localhost:8080"
```
or run headless:
```powershell
npx cypress run --config baseUrl="http://localhost:8080"
```

Run a single spec:
```powershell
npx cypress run --config baseUrl="http://localhost:8080" --spec "cypress/e2e/header.filters.cy.js"
```

Fixtures & deterministic tests
- The `frontend/cypress/fixtures` folder contains example fixtures used by e2e tests.
- Tests use `cy.intercept()` to stub `GET /errors` and make tests deterministic.

Useful Cypress helpers and recommendations
- Prefer `cy.intercept({ method: 'GET', url: /\/errors(\?|$)/ }, ...)` with `.as('errors')` and `cy.wait('@errors')` before asserting DOM.
- Use helper commands defined in `frontend/cypress/support` where available:
  - `cy.openSettings()` and `cy.openSettingsGroup(group)` — open sidebar settings and a specific group.
  - `cy.waitForTable({ timeout = 20000 })` — wait for `#errorTableBody` to appear.
  - `cy.getFirstRow()` — get the first `tr` inside `#errorTableBody`.
  - `cy.clickSettingsOption(group, value, opts = { force:false })` — open settings, group and click option with `data-value`.
  - `cy.openRowActions(index = 0)` — open the actions menu (edit/delete) for the row at `index` (default 0). Use before clicking `.error-table__btn--edit` or `.error-table__btn--delete` to ensure the action buttons are visible.
  - `cy.confirmDelete()` — click the delete confirmation button (`#deleteErrorButton`) inside the modal and wait for the modal to close.

Examples (short):
```powershell
# wait for table and assert there are 2 rows
cy.waitForTable();
cy.get('#errorTableBody tr').should('have.length', 2);

# get first row and check first cell contains an id
cy.getFirstRow().find('td').first().should('not.be.empty');

# change language to English (data-value="en") without forcing click
cy.clickSettingsOption('language', 'en');

# change theme and force the click if submenu is animated
cy.clickSettingsOption('theme', 'dark', { force: true });

# Open actions on first row and confirm deletion using helpers
cy.waitForTable();
cy.openRowActions(0);
cy.getFirstRow().find('.error-table__btn--delete').click({ force: true });
cy.confirmDelete();
```

Troubleshooting
- If Cypress cannot find the app: ensure dev server is running and use `--config baseUrl="http://localhost:8080"`.
- If your dev-server runs on a LAN IP (e.g. `192.168.*.*`) use that address for `baseUrl`.
- CRLF/LF differences: on Windows you may see warnings about line endings. These are non-fatal.

CI notes (suggestion)
- On PRs, run:
  - `npm ci`
  - `npm test`
  - Start dev server (if needed) and run `npx cypress run` in headless mode

---

Русский
=======

Этот файл описывает, как запускать unit и e2e тесты для фронтенда.

Требования
- Node.js (16+) и npm.
- Установить зависимости в папке `frontend`:
  ```powershell
  cd frontend
  npm install
  ```

Unit тесты (Jest)
-----------------
- Запустить все unit-тесты:
  ```powershell
  cd frontend
  npm test
  ```
- Запустить один тест (пример):
  ```powershell
  npm test -- src/scripts/__tests__/header.test.js
  ```
- Режим наблюдения:
  ```powershell
  npm test -- --watch
  ```

Зачем запускать unit-тесты?
- Быстрая проверка логики при изменениях.
- Помогают поймать баги до перехода к e2e.

End-to-end тесты (Cypress)
--------------------------
Cypress тесты взаимодействуют с запущенным приложением. Сначала нужно поднять dev-server.

1) Запустите dev-server в одном терминале:
```powershell
cd frontend
npm run start
```
Приложение обычно доступно по адресу http://localhost:8080. Если сервер слушает другой порт — используйте его.

2) Откройте Cypress (GUI):
```powershell
cd frontend
npx cypress open --config baseUrl="http://localhost:8080"
```
Или запустите в headless:
```powershell
npx cypress run --config baseUrl="http://localhost:8080"
```

Запуск одного спека:
```powershell
npx cypress run --config baseUrl="http://localhost:8080" --spec "cypress/e2e/header.filters.cy.js"
```

Фикстуры и детерминированные тесты
- В `frontend/cypress/fixtures` находятся фикстуры для тестов.
- Тесты используют `cy.intercept()` для стабилизации сетевых ответов.

Полезные хелперы и рекомендации для Cypress
- Предпочитайте `cy.intercept({ method: 'GET', url: /\/errors(\?|$)/ }, ...)` с присвоением алиаса через `.as('errors')` и ожиданием `cy.wait('@errors')` перед проверками DOM.
- Используйте helper-команды из `frontend/cypress/support`:
  - `cy.openSettings()` и `cy.openSettingsGroup(group)` — открывают настройки сайдбара и нужную группу.
  - `cy.waitForTable({ timeout = 20000 })` — ждёт появления `#errorTableBody`.
  - `cy.getFirstRow()` — получает первый `tr` внутри `#errorTableBody`.
  - `cy.clickSettingsOption(group, value, opts = { force:false })` — открывает настройки, группу и кликает опцию с `data-value`.
  - `cy.openRowActions(index = 0)` — открыть меню действий (edit/delete) для строки по индексу (по умолчанию 0). Используйте перед кликом `.error-table__btn--edit` или `.error-table__btn--delete`.
  - `cy.confirmDelete()` — нажать кнопку подтверждения удаления (`#deleteErrorButton`) в модалке и дождаться закрытия модального окна.

Примеры (коротко):
```powershell
# ждет таблицу и подтверждает, что есть 2 строки
cy.waitForTable();
cy.get('#errorTableBody tr').should('have.length', 2);

# получает первую строку и проверяет, содержит ли первая ячейка id
cy.getFirstRow().find('td').first().should('not.be.empty');

# изменить язык на английский (data-value="en") без принудительного нажатия
cy.clickSettingsOption('language', 'en');

# изменить тему и принудительно щелкнуть, если подменю анимировано
cy.clickSettingsOption('theme', 'dark', { force: true });

# Открыть меню действий первой строки и подтвердить удаление через хелперы
cy.waitForTable();
cy.openRowActions(0);
cy.getFirstRow().find('.error-table__btn--delete').click({ force: true });
cy.confirmDelete();
```

Устранение неполадок
- Если Cypress не видит приложение — проверьте, что dev-server запущен и используйте корректный `baseUrl`.
- Если dev-server слушает LAN IP — используйте этот адрес.
- Предупреждения о переводе LF/CRLF на Windows — обычно не критичны.

CI (рекомендация)
- В CI на PR запускайте:
  - `npm ci`
  - `npm test`
  - Поднимите dev-server (если нужно) и запустите `npx cypress run` в headless режиме

