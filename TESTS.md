TESTS — how to run tests
---

This document explains how to run unit and end-to-end tests for the repository and how CI is expected to run them.

Prerequisites
- Node.js (16+) and npm installed.
- Install dependencies from the repo root:

```powershell
npm ci
```

Unit tests (Jest)
-----------------
- Run all unit tests (frontend and backend) from the repo root:

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

- Run tests with coverage for all projects:

```powershell
npm run coverage:all
```

End-to-end tests (Cypress)
--------------------------
E2E tests require a running frontend (and optionally backend). From the repo root:

1) Start servers (frontend and backend):

```powershell
npm run start:all
```

2) Open Cypress (GUI) for local debugging:

```powershell
npm run test:e2e:open
```

3) Run Cypress headless (example):

```powershell
npm run test:e2e
```

Useful Cypress helpers and recommendations
- Prefer `cy.intercept({ method: 'GET', url: /\/errors(\?|$)/ }, ...)` with `.as('errors')` and `cy.wait('@errors')` before asserting DOM.
- Keep fixtures in `tests/e2e/fixtures` to make tests deterministic.
- Use helper commands defined in `tests/e2e/support` where available:
  - `cy.openSettings()` and `cy.openSettingsGroup(group)` — open sidebar settings and a specific group.
  - `cy.waitForTable({ timeout = 20000 })` — wait for `#errorTableBody` to appear.
  - `cy.getFirstRow()` — get the first `tr` inside `#errorTableBody`.
  - `cy.clickSettingsOption(group, value, opts = { force:false })` — open settings, group and click option with `data-value`.
  - `cy.openRowActions(index = 0)` — open the actions menu (edit/delete) for the row at `index` (default 0).
  - `cy.confirmDelete()` — click the delete confirmation button (`#deleteErrorButton`) inside the modal and wait for the modal to close.

Examples (short)
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
- If Cypress cannot find the app, ensure the dev server is running and use the correct `baseUrl`.
- If your dev-server runs on a LAN IP (e.g. `192.168.*.*`) use that address for `baseUrl`.
- CRLF/LF differences on Windows may produce warnings — usually non-fatal.

CI notes (recommended)
----------------------
- Recommended CI sequence for PRs and main branch runs:

```powershell
npm ci
npm run build:frontend
# start backend and serve the built frontend from `frontend/dist` as required by your workflow
# example (serve `frontend/dist` locally):
#   npm run serve:dist:frontend
# start backend in a separate terminal if needed:
#   npm run start:backend
npm run coverage:all
npm run test:e2e
```

- The repository exposes `test:coverage:frontend` and `test:coverage:backend` for local debugging; prefer `coverage:all` in CI to create a unified report.

---

- Local developer flow:
  - Run quick checks without coverage: `npm test` or `npm run test:frontend` / `npm run test:backend`.
  - Generate coverage locally (if you need a local report): `npm run coverage:all`.

- CI artifact publishing:
  - Upload `coverage/` and `frontend/dist` (the workflow already collects these artifacts).

- Notes:
  - Keep `test:coverage:frontend` and `test:coverage:backend` available for local debugging, but prefer `coverage:all` for CI to avoid conflicts and to produce a single `coverage/lcov.info`.
