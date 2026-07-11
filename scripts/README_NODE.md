Node setup and usage (align local environment with CI — Node 20.19.0)

Purpose
 - Ensure developers use the same Node version as CI (Node 20.19.0) so native binaries (esbuild, Cypress, etc.) install correctly and tests run reliably.

Recommended environment
 - Use WSL (Ubuntu/Debian) when developing on Windows. This avoids cross-OS binary issues when installing packages that include native components.

Quick automated setup (WSL)
 - Script: `scripts/setup-node-wsl.sh`
 - Run from the repository root in WSL:

```bash
bash ./scripts/setup-node-wsl.sh
```

What the script does
 - Installs `nvm` if missing
 - Installs Node `20.19.0`, sets it as the current/default version
 - Removes `node_modules` and runs `npm ci` to install dependencies

Windows (PowerShell) alternative
 - Use `nvm-windows` (https://github.com/coreybutler/nvm-windows):

```powershell
nvm install 20.19.0
nvm use 20.19.0
node -v
npm -v
```

How to run development and tests (after installing Node)

# 1) Start dev services (backend + frontend) using the repository's docker compose files
```bash
docker compose -f docker/docker-compose.dev.yml up -d --build
```

# 2) Run Cypress e2e locally (WSL)
```bash
npx cypress run --config-file tests/e2e/cypress.config.ts
```

## 3) Run Cypress inside Docker (from WSL)

Example 1 — run Cypress directly in a Docker container (legacy script):

```bash
# This example uses the `test:e2e:docker` helper in package.json.
# Set the base URL to the `static-frontend` service inside the Compose network.
CYPRESS_BASE_URL=http://static-frontend:80 npm run test:e2e:docker
```

Example 2 — recommended: run e2e using Compose (static built frontend + backend + cypress):

```bash
docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.e2e.yml up --abort-on-container-exit --exit-code-from cypress --build backend static-frontend cypress
```

Notes & recent repo changes
 - The repository has been adjusted to prefer Node 20.19.0 in Docker and CI. The main `docker/Dockerfile` contains test and cypress stages (use `--target test` or `--target cypress` to build them).
 - Production image installs now skip lifecycle scripts to avoid running `postinstall` (which calls `patch-package`) in production builds. Test stages still install devDependencies as needed.
 - If you see `require is not defined` in browser tests, run the frontend dev server with HMR/client disabled for e2e (the webpack config honors `CYPRESS_E2E` env var).
 - The repository has been adjusted to prefer Node 20.19.0 in Docker and CI. The main `docker/Dockerfile` now contains `test` and `cypress` stages (use `--target test` or `--target cypress` to build them).
 - The previous `docker/cypress.Dockerfile` was consolidated into `docker/Dockerfile`. `docker/docker-compose.e2e.yml` now builds from `docker/Dockerfile` with `target: cypress`.
 - Production image installs skip lifecycle scripts to avoid running `postinstall` (which calls `patch-package`) in production builds (`npm ci --omit=dev --ignore-scripts`). Test stages still install devDependencies as needed so patches are applied during development/CI.
 - `docker/docker-compose.e2e.yml` uses `nginx:alpine` to serve `frontend/dist` (mounted) as `static-frontend` on container port 80; the recommended `CYPRESS_BASE_URL` for containerized e2e is `http://static-frontend:80`.
 - Healthchecks were added to compose services so e2e waits for readiness before running.
 - If you see `require is not defined` in browser tests, run the frontend dev server with HMR/client disabled for e2e (the webpack config honors `CYPRESS_E2E` env var).
