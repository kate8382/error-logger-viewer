# VS Code Troubleshooting Guide

This document provides solutions for common VS Code issues when working with the Error Logger & Viewer repository.

## Common Issues

### 1. Copilot Chat Not Opening / Extension Host Unresponsive

**Symptoms:**
- Copilot chat panel doesn't open when clicked
- VS Code shows "Extension host is unresponsive" warnings
- Error: `chatParticipant must be declared in package.json: claude-code`
- Error: `[LM] Model copilot/oswe-vscode-secondary is already registered`

**Causes:**
- Conflicting VS Code extensions (especially multiple AI assistants)
- Extension host overload from too many active extensions
- Corrupted extension cache
- Third-party extensions trying to register chat participants without proper configuration

**Solutions:**

#### Step 1: Disable Conflicting Extensions
1. Open VS Code Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Extensions: Show Installed Extensions"
3. **Temporarily disable** any AI assistant extensions except GitHub Copilot:
   - Claude Code (if installed)
   - Codeium
   - Tabnine
   - Any other AI code assistants
4. Reload VS Code window (`Ctrl+R` / `Cmd+R`)

#### Step 2: Clear Extension Host Cache
1. Close VS Code completely
2. Delete extension host cache:
   - **Windows**: `%USERPROFILE%\.vscode\extensions` (delete folders with "claude" or duplicate copilot installations)
   - **macOS**: `~/.vscode/extensions`
   - **Linux**: `~/.vscode/extensions`
3. Restart VS Code

#### Step 3: Reinstall GitHub Copilot
If the issue persists:
1. Uninstall GitHub Copilot and GitHub Copilot Chat extensions
2. Restart VS Code
3. Reinstall both extensions from the marketplace
4. Sign in to GitHub Copilot again

#### Step 4: Check Extension Settings
Make sure you don't have conflicting settings in your user settings:
1. Open Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "chat participant"
3. Remove any custom chat participant configurations
4. Search for "copilot" and reset any unusual settings to default

#### Step 5: Use Workspace Settings (Recommended)
This repository includes optimized `.vscode/settings.json` that:
- Disables automatic extension updates during work sessions
- Optimizes file watching to reduce load
- Excludes build artifacts and dependencies from search
- Configures proper working directories for ESLint

These settings are automatically applied when you open this workspace.

### 2. `vscode.json-language-features` Taking 100% CPU

**Symptoms:**
- High CPU usage
- VS Code becomes slow or freezes
- Profiling shows `vscode.json-language-features` consuming resources

**Solutions:**

#### Check for Large JSON Files
1. Look for very large JSON files in your workspace (e.g., `package-lock.json`, `db.json`)
2. Exclude them from JSON validation:
   ```json
   {
     "json.validate.enable": false
   }
   ```
   Or exclude specific files:
   ```json
   {
     "files.associations": {
       "package-lock.json": "plaintext",
       "db.json": "plaintext"
     }
   }
   ```

#### Disable JSON Features Temporarily
Add to your user settings:
```json
{
  "json.schemaDownload.enable": false,
  "json.validate.enable": false
}
```

### 3. Extension Installation Issues

**Error:** Extensions fail to install or update

**Solutions:**
1. Check your internet connection
2. Try using VS Code without a proxy:
   - Settings → Search "proxy" → Set to "off"
3. Clear VS Code cache:
   - Close VS Code
   - Delete `%APPDATA%\Code\Cache` (Windows) or `~/Library/Application Support/Code/Cache` (macOS)
4. Update VS Code to the latest version

### 4. Multiple Model Registration Warnings

**Warning:** `Model copilot/oswe-vscode-secondary is already registered. Skipping.`

This is usually harmless and occurs when:
- VS Code reloads the extension host
- Multiple extensions try to register the same model

**Solution:** Ignore this warning unless it causes actual functionality issues. If it does:
1. Disable all Copilot-related extensions
2. Close VS Code completely
3. Enable only the official GitHub Copilot extensions
4. Restart VS Code

## Best Practices for This Repository

### Recommended Extensions
The repository includes `.vscode/extensions.json` with recommended extensions:
- **ESLint** - For code linting
- **GitHub Copilot** - AI pair programmer
- **GitHub Copilot Chat** - AI assistant

Install recommended extensions when prompted by VS Code.

### Performance Tips
1. **Close unnecessary files** - Keep only relevant files open
2. **Use workspace folders** - Open only `frontend` or `backend` folder when working on one part
3. **Disable auto-save** - It can trigger excessive rebuilds
4. **Use .gitignore patterns** - Already configured to exclude `node_modules`, `dist`, `coverage`

### Working with Multiple Workspaces
If you work on both frontend and backend:
1. Open as a multi-root workspace:
   - File → Add Folder to Workspace
   - Add both `frontend` and `backend` folders
2. This helps ESLint and other tools work correctly with different configurations

## Getting Help

If you continue to experience issues:

1. **Check VS Code Output Panel**:
   - View → Output
   - Select "Extension Host" from dropdown
   - Look for specific error messages

2. **Enable Extension Development Host Logging**:
   ```
   code --log debug
   ```

3. **Report Issues**:
   - For VS Code issues: https://github.com/microsoft/vscode/issues
   - For Copilot issues: https://github.com/community/community/discussions/categories/copilot
   - For this repository: https://github.com/kate8382/error-logger-viewer/issues

## Additional Resources

- [VS Code Performance Issues](https://code.visualstudio.com/docs/supporting/troubleshoot-performance)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [VS Code Extension Troubleshooting](https://code.visualstudio.com/docs/editor/extension-marketplace#_troubleshooting)

---

Last updated: November 2025
