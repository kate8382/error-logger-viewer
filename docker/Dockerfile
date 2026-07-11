FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:frontend && npm run build:backend

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/db.json ./backend/db.json
COPY --from=builder /app/config ./config

EXPOSE 3000

CMD ["npm", "run", "start:backend"]

### Test stages
FROM node:20.19.0 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Install all deps including devDependencies for test stage
RUN npm ci

FROM deps AS test
WORKDIR /app
COPY . .
# Run unit tests by default when this stage is targeted
CMD ["npm", "test"]

### Cypress E2E stage (reuse cypress/included image to keep Cypress binary and browsers)
FROM cypress/included:12.17.4 AS cypress
WORKDIR /e2e

# Install project deps in e2e context (dev deps required for ts-node, etc)
COPY package.json package-lock.json ./
ENV NPM_CONFIG_PRODUCTION=false
RUN npm ci --no-audit --prefer-offline

# copy only tests and necessary config
COPY tests ./tests

# copy root TypeScript configs and type declarations so ts-node can resolve extends/includes
COPY tsconfig.base.json tsconfig.types.json tests/tsconfig.tests.json ./
COPY types ./types
# install ts-node so Cypress can require TypeScript config directly
RUN npm install --no-audit --prefer-offline --legacy-peer-deps ts-node

# ensure Node will register ts-node when requiring .ts files
ENV NODE_OPTIONS=--require\ ts-node/register

ENTRYPOINT ["npx","cypress","run","--config-file","tests/e2e/cypress.config.ts"]
