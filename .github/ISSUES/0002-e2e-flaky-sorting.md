Title: Flaky Cypress e2e: server-side sort test intermittently fails

Summary
-------
The e2e test `Table of Errors -> сортирует по count (серверная сортировка)` intermittently fails locally because Cypress sometimes does not observe the `getErrorsSorted` request or the table order does not update as expected. On GitHub CI the PR checks are currently green, but local runs reproduced the failure during investigation.

Reproduction steps (local)
-------------------------
1. Build and serve the frontend: `npm run build` and `npx http-server ./dist -p 8080`
2. Run Cypress: `npx cypress run --config baseUrl=http://localhost:8080 --headless --spec cypress/e2e/table.cy.js`

Observed behavior
-----------------
- Failure: Cypress times out waiting for the intercepted `getErrorsSorted` request, or the row order remains `['err-1','err-2']` instead of `['err-2','err-1']` depending on timing.
- Recent change: `HeaderManager` now prefers to call `ErrorTable.handleSort` when available; this may issue a server request depending on `ErrorTable.errorApi.mode`. Timing and which instance handles the click affect whether the request is issued and whether the intercept alias matches.

Possible causes
---------------
- Delegate selector is too broad and may not target the actual button element that produces the expected network call.
- `ErrorTable.errorApi.mode` might be `demo` during tests, so `handleSort` performs local sorting or no network call.
- Race condition: header handlers may run before global `errorTableInstance` is initialized.

Planned fixes
-------------
- Narrow the delegated selector in `HeaderManager.addTableSortHandlers` to target sorting buttons specifically (e.g. `button[id^="sortBy"]`).
- Ensure `window.errorTableInstance` is initialized in `server` mode when e2e tests run, or make `handleSort` robust to missing instance.
- Consider making Cypress intercepts more permissive or intercept both server and local sorting patterns.
- Re-run full Cypress suite locally and on CI to confirm stability.
