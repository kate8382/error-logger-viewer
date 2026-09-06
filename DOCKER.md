# Docker Setup & Deployment Guide

This document provides instructions for running and deploying **Error Logger & Viewer** using Docker and Docker Compose.

## Multi-Stage Production Build

The production Dockerfile utilizes a multi-stage build:
1. **Builder stage:** Installs `devDependencies`, compiles frontend assets (`frontend/dist`), backend TS files (`backend/dist`), and type declarations.
2. **Runtime stage:** Installs only production dependencies and runs the compiled backend.

---

## Quick Start with Docker

### Build & Run Single Image
```bash
# Build image
docker build -t error-logger-viewer .

# Run container
docker run -p 3000:3000 error-logger-viewer
```
## Docker Compose Workflows

### 1. Production Mode
Runs the optimized build. The LowDB file is persisted in a named Docker volume (`DB_FILE=/app/data/db.json`), includes `restart: unless-stopped`, and an automated `/errors` healthcheck.

Using helper scripts:
# Linux / macOS / Git Bash
./start-prod.sh

# Windows PowerShell
.\start-prod.ps1
Or manually:

Bash

```
docker compose up --build
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 2. Development Mode (with Hot Reload)
Mounts source code into containers. Frontend runs via Webpack Dev Server on port 8080, and backend runs on port 3000 with proxying.

Using helper scripts:

Bash

```
# Linux / macOS / Git Bash
./start-dev.sh

# Windows PowerShell
.\start-dev.ps1
```

Or manually:

Bash

```
docker compose -f docker-compose.dev.yml up --build
```

- Backend: `http://localhost:3000`
- Frontend (Hot Reload): `http://localhost:8080`
*Note: The frontend container uses Node's native `fetch` to wait for backend readiness before starting `webpack-dev-server`, preventing initial connection errors.*

## Environment & Registry Workflows

### Environment Overrides
Copy `.env.example` to `.env` for local configuration:

```
PORT=3000
API_PROXY_TARGET=http://localhost:3000
DB_FILE=backend/db.json
```

### Registry & Deployment

1. **Docker Registry Deployment:** CI builds multi-stage images and pushes them to GHCR/Docker Hub with immutable tags. Production servers deploy via `docker compose pull && docker compose up -d`.
2. **Artifact Branch Fallback:** For non-Docker hosting (e.g., cPanel), CI pushes pre-built `frontend/dist` and `backend/dist` directly to a dedicated deployment branch.