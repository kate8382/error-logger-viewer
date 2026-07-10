FROM cypress/included:12.17.4

WORKDIR /e2e

COPY package.json package-lock.json ./
ENV NPM_CONFIG_PRODUCTION=false
RUN npm ci --no-audit --prefer-offline

# copy only tests and necessary config
COPY tests ./tests

# copy root TypeScript configs and type declarations so ts-node can resolve extends/includes
COPY tsconfig.base.json tsconfig.tests.json tsconfig.types.json ./
COPY types ./types
# install ts-node so Cypress can require TypeScript config directly
RUN npm install --no-audit --prefer-offline --legacy-peer-deps ts-node

# ensure Node will register ts-node when requiring .ts files
ENV NODE_OPTIONS=--require\ ts-node/register

ENTRYPOINT ["npx","cypress","run","--config-file","tests/e2e/cypress.config.ts"]
