FROM cypress/included:12.17.4

WORKDIR /e2e

COPY package.json package-lock.json ./
ENV NPM_CONFIG_PRODUCTION=false
RUN npm ci --no-audit --prefer-offline

# copy only tests and necessary config
COPY tests ./tests

# transpile TypeScript Cypress config to CommonJS using esbuild
RUN npx esbuild tests/e2e/cypress.config.ts --bundle --platform=node --format=cjs --outfile=tests/e2e/cypress.config.cjs || true

ENTRYPOINT ["npx","cypress","run","--config-file","tests/e2e/cypress.config.cjs"]
