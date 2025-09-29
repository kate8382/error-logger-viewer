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

## VS Code Setup & Troubleshooting

This section provides comprehensive setup instructions and solutions for common VS Code issues when working with this project.

### Initial Setup

1. **Install recommended extensions** (will be prompted automatically when opening the project):
   - ESLint - for code linting
   - Prettier - for code formatting
   - Path Intellisense - for better file path completion
   - Auto Rename Tag - for HTML/JSX tag renaming

2. **VS Code workspace configuration is included** in `.vscode/` folder with:
   - Optimized settings for the project
   - Debug configurations for both frontend and backend
   - Useful tasks for development

### Common VS Code Issues & Solutions

#### 1. VS Code Shortcut/Launcher Problems (Windows)

**Problem**: "The object code.exe that this shortcut refers to has been changed or moved, and the shortcut no longer works. Do you want to delete this shortcut?"

**Solutions**:

1. **Reinstall VS Code**:
   - Download latest VS Code from [https://code.visualstudio.com/](https://code.visualstudio.com/)
   - Run the installer and choose "Add to PATH"
   - The new installation will fix broken shortcuts

2. **Fix existing shortcut**:
   - Right-click on the broken VS Code shortcut
   - Select "Properties"
   - In "Target" field, update path to: `C:\Users\{YourUsername}\AppData\Local\Programs\Microsoft VS Code\Code.exe`
   - In "Start in" field, set: `C:\Users\{YourUsername}\AppData\Local\Programs\Microsoft VS Code\`
   - Click "OK"

3. **Create new shortcut**:
   - Navigate to VS Code installation folder (usually `C:\Users\{YourUsername}\AppData\Local\Programs\Microsoft VS Code\`)
   - Right-click on `Code.exe` → "Send to" → "Desktop (create shortcut)"

4. **Alternative launch methods**:
   - Press `Win + R`, type `code`, press Enter
   - Open Command Prompt/PowerShell, type `code .` in project folder
   - Search "Visual Studio Code" in Start Menu

#### 2. Project-Specific Setup

**Opening the project correctly**:
```bash
# Method 1: Command line (recommended)
cd /path/to/error-logger-viewer
code .

# Method 2: VS Code menu
# File → Open Folder → Select error-logger-viewer folder
```

**Setting up the development environment**:
1. Open VS Code in the project root folder
2. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
3. Type "Tasks: Run Task" and select it
4. Choose "Install Backend Dependencies" and wait for completion
5. Run "Install Frontend Dependencies"
6. Run "Start Backend" and "Start Frontend" in separate terminals

#### 3. Extension and Configuration Issues

**ESLint not working**:
```json
// Add to VS Code settings.json if needed
{
  "eslint.workingDirectories": ["frontend", "backend"],
  "eslint.validate": ["javascript"]
}
```

**Prettier formatting issues**:
- Install Prettier extension
- Set as default formatter: `Ctrl+Shift+P` → "Format Document With" → "Prettier"

**Path completion not working**:
- Install "Path Intellisense" extension
- Restart VS Code

#### 4. Terminal and Task Issues

**PowerShell execution policy error (Windows)**:
```powershell
# Run in PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Node.js not found**:
- Install Node.js from [https://nodejs.org/](https://nodejs.org/)
- Restart VS Code after installation
- Verify with `node --version` in VS Code terminal

#### 5. Debugging Setup

**Debug configuration**:
- Press `F5` or go to Run and Debug panel
- Select "Launch Full Application" to start both backend and frontend
- Set breakpoints in code by clicking left margin
- Use "Debug Backend" for server-side debugging

### Development Workflow

**Recommended workflow**:
1. Open project: `code .` in terminal or File → Open Folder
2. Start development servers:
   - Press `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Backend"
   - Press `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Frontend"
3. Code with auto-formatting and linting enabled
4. Use debug configurations for troubleshooting

**Useful keyboard shortcuts**:
- `Ctrl+`` ` - Toggle terminal
- `Ctrl+Shift+`` ` - New terminal
- `Ctrl+P` - Quick file search
- `Ctrl+Shift+P` - Command palette
- `F5` - Start debugging
- `Ctrl+F5` - Run without debugging

### Troubleshooting Checklist

If VS Code isn't working properly:

- [ ] VS Code is installed and updated to latest version
- [ ] Project is opened as folder (not individual files)
- [ ] Node.js is installed and accessible in terminal
- [ ] Required extensions are installed
- [ ] npm dependencies are installed in both frontend and backend
- [ ] No conflicting extensions or settings
- [ ] VS Code is restarted after configuration changes

For persistent issues, try:
1. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Reset VS Code settings: Remove `.vscode/settings.json` temporarily
3. Clean reinstall: Uninstall VS Code completely, remove settings folder, reinstall

**📚 Документация на русском языке**: [Настройка VS Code (Russian)](VSCODE_SETUP_RU.md)

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
