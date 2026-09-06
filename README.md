# Error Logger & Viewer

[![CI](https://github.com/kate8382/error-logger-viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/kate8382/error-logger-viewer/actions)
[![Pages](https://github.com/kate8382/error-logger-viewer/actions/workflows/deploy-gh-pages.yml/badge.svg)](https://github.com/kate8382/error-logger-viewer/actions)

**Error Logger & Viewer** is a modern full-stack SPA for collecting, storing, analyzing, and visualizing client-side JavaScript errors in web applications. Built with TypeScript across both frontend and backend, it provides developers with tools to track runtime exceptions, promise rejections, and network failures in real time.

![Banner](./frontend/src/assets/img/banner_ELV-1.png)

🚀 **Live Demo:** [https://kate8382.github.io/error-logger-viewer/](https://kate8382.github.io/error-logger-viewer/) — click *"Create test error"* on the demo page to test the app in action.


### 📖 Articles & Publications
- [How I migrated my pet project to TypeScript, or Katya in Wonderland](https://dev.to/kate8382/how-i-migrated-my-pet-project-to-typescript-or-katya-in-wonderland-328a) — Personal migration story (written for #WeCoded 2026 Challenge).
- [Error Logger Viewer - tiny SPA for tracking JS errors](https://dev.to/kate8382/error-logger-viewer-tiny-spa-for-tracking-js-errors-12mk) — Technical overview and feature breakdown.

## Main Features

- **Global Error Collection:** Intercepts client-side JavaScript runtime errors (`window.onerror`), unhandled promise rejections (`window.onunhandledrejection`), resource loading failures, and network/fetch errors.
- **Security-Hardened Backend:** Express REST API with security middleware (`helmet`, CORS allowlists, ingest rate-limiting at 60 req/min, request payload validation, and API keys for PUT/DELETE requests).
- **Analytics & Visualization:** Dynamic charts by period (day, week, month, year) and doughnut charts categorized by error type and status (`new`, `in_progress`, `fixed`, `ignored`).
- **Filtering & Management:** Full-text search, multi-field sorting, interactive modals for changing status and adding comments.
- **Dual Modes:** Operates seamlessly with the Node.js + Express + LowDB backend or in standalone client Demo mode (`localStorage`).
- **Multilanguage & UI/UX:** Dynamic Russian and English translation (`i18n.ts`), responsive layout, dark/light theme support, and ARIA accessibility features.

## Screenshots

| ![Dashboard](screenshots/dashboard-view.png) | ![Table](screenshots/table-filter-view.png) |
|---|---|
| **Main Dashboard** | **Error Table & Filters** |
| ![Modal](screenshots/modal-view.png) | ![Chart](screenshots/chart-view.png) |
| **Error Details Modal** | **Analytics & Charts** |

---

## Quick Start

### 1. Local Setup
Ensure Node.js (16+) is installed. Install dependencies and start both backend and frontend concurrently:

```bash
# Install dependencies (automatically runs patch-package)
npm ci

# Run backend and frontend concurrently
npm run start:all
```

Individual commands:

- **Backend dev server:** `npm run dev:backend` **(port 3000)**
- **Frontend dev server:** `npm run dev:frontend` **(port 8080)**
- **Production build preview:** `npm run build:frontend && npm run serve:dist:frontend`

### 2. Docker Execution

Run in production mode using Docker Compose:

```bash
docker compose up --build
```
📄 For full development workflows, healthchecks, and environment configuration, see **[DOCKER.md](./DOCKER.md)**.

## Architecture & Technical Details

- **Frontend (`frontend/src`):** Modular TypeScript SPA architecture. Key modules include `main.ts` (app init & global error handlers), `api.ts` (universal API client for server/localStorage), UI components (`table.ts`, `stats.ts`, `charts.ts`, `modal.ts`, `header.ts`, `aside.ts`), and dynamic localization (`i18n.ts`).
- **Backend (`backend/src`):** Express REST API backed by LowDB (JSON storage). Handles data ingestion, error grouping (by type, message, stack, date), and stats aggregation — secured with `helmet`, CORS allowlists, rate limiting, and request payload validation (PUT/DELETE allowlists).
- **Shared Declarations (`types/`):** Centralized TypeScript type definitions referenced across frontend and backend via path aliases (`tsconfig.base.json`, e.g., `projects`, `errors`, `users`). Generated via `npm run build:types`.

```
error-logger-viewer/
├── .github/          # CI/CD workflows and GitHub Actions
├── backend/          # Express API server, LowDB storage, and configs
├── frontend/         # SPA frontend source (TS, SCSS, Webpack)
├── config/           # Runtime configurations (periods.json, etc.)
├── tests/            # Unit (Jest) and E2E (Cypress) test suites
├── types/            # Shared TypeScript type definitions
└── screenshots/      # README preview media
```

## Documentation & Guidelines

- **[TESTS.md](./TESTS.md):** Running unit tests, E2E Cypress specs, and CI validation.
- **[CONTRIBUTING.md](./CONTRIBUTING.md):** Code style, PR requirements, and patch-package details.
- **[DOCKER.md](./DOCKER.md):** Detailed Docker & Compose deployment setups.

## Acknowledgements

- **Application Development:** [kate8382](https://github.com/kate8382)
- **Backend Architecture & Security:** Collaboration with [Manuja](https://github.com/MMVS-79)
- **UI Design Kit:** [M. Ali, Free Admin Dashboard UI Kit](https://www.figma.com/community/file/1244293267600418871)

## License
Licensed under the [MIT License](./LICENSE).
