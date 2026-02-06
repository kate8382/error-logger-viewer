TESTS — how to run tests (EN) / ТЕСТЫ — как запускать тесты (RU)

---

English
=======

This document explains how to run unit and end-to-end tests for the frontend.

Prerequisites
- Node.js (16+) and npm installed.
- Project dependencies installed (from repo root):
  ```powershell
  npm install
  # or if you prefer to install only frontend deps:
  # npx --prefix frontend npm install
  ```

Unit tests (Jest)
-----------------
- Run all frontend unit tests from repo root:
  ```powershell
  npm run test:frontend
  ```
- Run a single test file (example):
  ```powershell
  npm run test:frontend -- src/scripts/__tests__/header.test.js
  ```
- Run in watch mode:
  ```powershell
  npm run test:frontend -- --watch
  ```

Why run unit tests?
- Quick feedback on business logic changes.
- Ensures small modules behave correctly before running e2e.

End-to-end tests (Cypress)
--------------------------
Cypress tests interact with a running frontend application. Start the dev server from the repo root first.

1) Start dev server in one terminal:
```powershell
npm run dev:frontend
```
The app is usually available at http://localhost:8080. If your dev server uses a different host/port, see the "Troubleshooting" section.

2) Open Cypress (interactive) from root using `--prefix` to run the `frontend` package tools:
```powershell
npx --prefix frontend cypress open --config baseUrl="http://localhost:8080"
```
Or run headless:
```powershell
npx --prefix frontend cypress run --config baseUrl="http://localhost:8080"
```

Run a single spec:
```powershell
npx --prefix frontend cypress run --config baseUrl="http://localhost:8080" --spec "cypress/e2e/header.filters.cy.js"
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

CI notes (recommended)

- Use an aggregated coverage report in CI. The CI job should run the single command that produces a combined coverage report for the repository:

```powershell
npm ci
npm run build:frontend
# start backend + serve dist as required by your workflow
npm run coverage:all
npm run test:e2e
```

- Local developer flow:
  - Run quick checks without coverage: `npm test` or `npm run test:frontend` / `npm run test:backend`.
  - Generate coverage locally (if you need a local report): `npm run coverage:all`.

- CI artifact publishing:
  - Upload `coverage/` and `frontend/dist` (the workflow already collects these artifacts).

- Notes:
  - Keep `test:coverage:frontend` and `test:coverage:backend` available for local debugging, but prefer `coverage:all` for CI to avoid conflicts and to produce a single `coverage/lcov.info`.

---

## Code style (createElement usage)

We standardize calls to `createElement` in the frontend codebase to improve readability and type-safety.

- Preferred style: use camelCase top-level fields for common attributes and `attrs` for less common or kebab-case attributes.
  - Examples: `className`, `id`, `tabIndex`, `dataI18n`, `ariaLabel`, `ariaHidden`, `text`, `disabled`.
  - For other attributes use `attrs: { 'data-foo': 'bar', 'aria-foo': 'baz' }`.
- Rationale: camelCase top-level fields are easier to discover in TypeScript and are mapped by `createElement` to the correct HTML attributes (for example `dataI18n` → `data-i18n`, `ariaLabel` → `aria-label`).

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
```markdown
TESTS — how to run tests (EN) / ТЕСТЫ — как запускать тесты (RU)

---

English
=======

This document explains how to run unit and end-to-end tests for the repository.

Prerequisites
- Node.js (16+) and npm installed.
- Project dependencies installed (from repo root):
  ```powershell
  npm ci
  # or if you prefer to install only frontend deps:
  # npx --prefix frontend npm ci
  ```

Unit tests (Jest)
-----------------
- Run all unit tests (both frontend and backend) from repo root:
  ```powershell
  npm test
  ```
- Run frontend tests only:
  ```powershell
  npm run test:frontend
  ```
- Run backend tests only:
  ```powershell
  npm run test:backend
  ```
- Run in watch mode (example for frontend):
  ```powershell
  npm run test:frontend -- --watch
  ```

Why run unit tests?
- Quick feedback on business logic changes.
- Ensures small modules behave correctly before running e2e.

End-to-end tests (Cypress)
--------------------------
Cypress tests interact with a running frontend application. Start the dev server from the repo root first.

1) Start dev server in one terminal:
```powershell
npm run dev:frontend
```
The app is usually available at http://localhost:8080. If your dev server uses a different host/port, see the "Troubleshooting" section.

2) Open Cypress (interactive) from repo root using `--prefix` to run frontend tools:
```powershell
npx --prefix frontend cypress open --config baseUrl="http://localhost:8080"
```
Or run headless:
```powershell
npx --prefix frontend cypress run --config baseUrl="http://localhost:8080"
```

Run a single spec (example):
```powershell
npx --prefix frontend cypress run --config baseUrl="http://localhost:8080" --spec "cypress/e2e/header.filters.cy.js"
```

Fixtures & deterministic tests
- The `frontend/cypress/fixtures` folder contains example fixtures used by e2e tests.
- Tests use `cy.intercept()` to stub `GET /errors` and make tests deterministic.

Useful Cypress helpers and recommendations
- Prefer `cy.intercept({ method: 'GET', url: /\/errors(\?|$)/ }, ...)` with `.as('errors')` and `cy.wait('@errors')` before asserting DOM.
- Use helper commands defined in `frontend/cypress/support` where available (see `frontend/cypress/support`):
  - `cy.openSettings()` and `cy.openSettingsGroup(group)` — open sidebar settings and a specific group.
  - `cy.waitForTable({ timeout = 20000 })` — wait for `#errorTableBody` to appear.
  - `cy.getFirstRow()` — get the first `tr` inside `#errorTableBody`.
  - `cy.clickSettingsOption(group, value, opts = { force:false })` — open settings, group and click option with `data-value`.
  - `cy.openRowActions(index = 0)` — open the actions menu (edit/delete) for the row at `index` (default 0).
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

CI notes (recommended)

- Use an aggregated coverage report in CI. The CI job should run the single command that produces a combined coverage report for the repository. Example CI sequence:

```powershell
npm ci
npm run build:frontend
# start backend + serve frontend/dist as required by your workflow
npm run coverage:all
npm run test:e2e
```

- Local developer flow:
  - Run quick checks without coverage: `npm test` or `npm run test:frontend` / `npm run test:backend`.
  - Generate coverage locally (if you need a local report): `npm run coverage:all`.

- CI artifact publishing:
  - Upload `coverage/` and `frontend/dist` (the workflow already collects these artifacts).

- Notes:
  - Keep `test:coverage:frontend` and `test:coverage:backend` available for local debugging, but prefer `coverage:all` for CI to avoid conflicts and to produce a single `coverage/lcov.info`.

---

## Code style (createElement usage)

We standardize calls to `createElement` in the frontend codebase to improve readability and type-safety.

- Preferred style: use camelCase top-level fields for common attributes and `attrs` for less common or kebab-case attributes.
  - Examples: `className`, `id`, `tabIndex`, `dataI18n`, `ariaLabel`, `ariaHidden`, `text`, `disabled`.
  - For other attributes use `attrs: { 'data-foo': 'bar', 'aria-foo': 'baz' }`.
- Rationale: camelCase top-level fields are easier to discover in TypeScript and are mapped by `createElement` to the correct HTML attributes (for example `dataI18n` → `data-i18n`, `ariaLabel` → `aria-label`).

---
Русский
=======

Этот файл описывает, как запускать unit и e2e тесты для проекта.

Требования
- Node.js (16+) и npm.
- Установите зависимости из корня проекта:
  ```powershell
  npm ci
  ```

Unit тесты (Jest)
-----------------
- Запустить все unit-тесты (фронтенд и бэкенд) из корня:
  ```powershell
  npm test
  ```
- Запустить только фронтенд тесты:
  ```powershell
  npm run test:frontend
  ```
- Запустить только бэкенд тесты:
  ```powershell
  npm run test:backend
  ```

End-to-end тесты (Cypress)
--------------------------
Поднимите dev-server (см. выше) и используйте команды:
```powershell
npm run dev:frontend
npx --prefix frontend cypress open --config baseUrl="http://localhost:8080"
```

Устранение неполадок
- Если Cypress не видит приложение — проверьте, что dev-server запущен и используйте корректный `baseUrl`.
- Предупреждения о переводе LF/CRLF на Windows — обычно не критичны.

CI (рекомендация)
- В CI на PR запускать:
  - `npm ci`
  - `npm run build:frontend`
  - `npm run coverage:all`
  - `npm run test:e2e`
