Summary of changes added on 2026-01-18

- Migrate `charts.js` -> `charts.ts`: additional refactors and type-safe improvements.
- Unified ISO-week calculation between frontend and backend to ensure identical period keys.
- Removed frontend-side slicing of period lists: server now enforces limits (config/periods.json).
- Added shared config: `config/periods.json` (day:7, week:8, month:6, year:4).
- Backend: applied server-side period limits and added a simple unit test `backend/tests/stats.test.js`.
- Frontend: refactored `prepareBarChartData` to reduce duplication (helper for datasets), improved `updateFontSize` logic.
- All frontend tests passed locally (`npm --workspace=frontend test`).

Notes:
- This commit was created to be included in the open PR "Migrate charts.js to TypeScript" on branch `feat/migrate-charts-ts`.
- If you prefer server-only enforcement of limits, frontend slicing was removed so the server is the single source of truth.
