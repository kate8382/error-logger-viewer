import { defineConfig } from 'cypress';
import createEsbuildPlugin from '@bahmutov/cypress-esbuild-preprocessor';

export default defineConfig({
  e2e: {
    // позволяет переопределять базовый URL через переменную окружения CYPRESS_BASE_URL; по умолчанию localhost для удобства CI
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:8080',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    //  Пути относительно корня репозитория — все артефакты cypress помещаются в tests/e2e
    screenshotsFolder: 'tests/e2e/cypress/screenshots',
    videosFolder: 'tests/e2e/cypress/videos',
    fixturesFolder: 'tests/e2e/fixtures',
    // папка с тестами (раньше integrationFolder -> теперь specPattern)
    specPattern: 'tests/e2e/specs/**/*.cy.{js,ts}',
    // файл support (используй .ts после миграции)
    supportFile: 'tests/e2e/support/e2e.ts',
    //  исключить папки с покрытием или другие
    excludeSpecPattern: ['**/coverage/**'],
    defaultCommandTimeout: 8000,
    pageLoadTimeout: 120000,
    chromeWebSecurity: false,
    env: {},
    // настройка препроцессора с esbuild для поддержки TypeScript
    setupNodeEvents(on, config) {
      on('file:preprocessor', createEsbuildPlugin());
      return config;
    },
  },
});
