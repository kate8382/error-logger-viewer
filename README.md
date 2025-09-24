# Error Logger & Viewer

**Error Logger & Viewer** is a modern SPA for collecting, storing, analyzing, and visualizing JavaScript errors in web projects. It is designed for developers and teams who need to quickly identify, group, and track errors in production or test environments.

---

## Purpose

The application allows you to:
- Automatically collect JS errors, resource loading errors, unhandled promises, and fetch errors.
- Store errors on the server or in local storage (demo mode).
- View statistics by type, status, date, and a detailed error table.
- Quickly filter, sort, and comment on errors.
- Track error status (new, in progress, fixed, ignored).
- Work in two languages: Russian and English.

---

## Main Features

- **Global error collection:**
	Uses global handlers (window.onerror, window.onunhandledrejection), fetch interception, and resource load error tracking.
- **Flexible filtering and sorting:**
	Search by application, filter by section, sort by any field.
- **Visualization:**
	Charts by day/week/month/year, doughnut charts by type and status.
- **Multilanguage:**
	All texts and UI are dynamically translated (i18n.js).
- **Modes:**
	Server (Node.js + Express + LowDB) and demo (localStorage).
- **Edit and delete errors:**
	Through modals with comments and status change support.

---

## How to Use

1. **Installation and launch**
	 - Backend: Node.js, Express, LowDB (db.json file).
	 - Frontend: SPA in pure JS, built with Webpack.
	 - Start server and frontend (`npm start` in respective folders).

2. **Error collection**
	 - All errors are automatically logged when they occur on the page.
	 - For testing, you can create an error manually ("Create test error" button at the bottom of the page).

3. **Navigation**
	 - Sidebar: switch between sections (About, Statistics, Charts, Error Table, Settings).
	 - Header: search by application, language switch, quick access to filters.

4. **Working with errors**
	 - In the table, you can sort, filter, edit, and delete errors.
	 - The modal window provides details, comments, and status change.

5. **Analytics**
	 - "Statistics" section — quick overview by type and status.
	 - "Charts" section — error dynamics over time.

---

## Architecture & Technical Details

- **Frontend (src/js):**
	- `main.js` — app initialization, global error handlers, API integration.
	- `api.js` — universal API client for server/localStorage.
	- `header.js` — header management, search, filtering, localization.
	- `aside.js` — sidebar logic, language/theme/mode switching.
	- `table.js` — error table rendering and management.
	- `stats.js` — statistics calculation and visualization.
	- `charts.js` — chart building by period.
	- `modal.js` — modals for editing and deleting errors.
	- `i18n.js` — all translatable UI strings.

- **Backend (backend/server.js):**
	- Node.js + Express + LowDB (JSON file).
	- REST API: get, add, update, delete errors, get statistics.
	- Error grouping by type, message, stack, and date.

- **Localization:**
	- All texts are in i18n.js, dynamic language switching supported.

- **UI/UX:**
	- Modern responsive interface, fast feedback, loading spinners, theme support.

---

## Usage Scenarios

- **Production error monitoring:**
	Connect handlers to your project, and all errors will be collected and displayed in Error Logger & Viewer.
- **Error dynamics analysis:**
	Use charts and statistics to identify spikes and trends.
- **Team collaboration:**
	Change error statuses, add comments, track fix progress.

---

## Features & Benefits

- Simple integration and setup.
- No external services required (can work fully locally).
- Flexible architecture: easy to extend and modify.
- Open source, easy to customize for your needs.

---

## Requirements

- Node.js (for backend)
- Modern browser (for frontend)
- Webpack (for frontend build)

---

## How to contribute

1. Fork the repository.
2. Make changes to the required JS file.
3. Submit a pull request with a description of the changes.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

_If you have suggestions or questions — create an issue on GitHub or comment on the project._
