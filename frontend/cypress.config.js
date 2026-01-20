const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Allow CI or local env to override baseUrl via CYPRESS_BASE_URL; default to localhost for CI friendliness
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:8080',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false, // не сохранять видео
    screenshotsFolder: 'cypress/screenshots', // папка для скриншотов
    videosFolder: 'cypress/videos', // папка для видео
    fixturesFolder: 'cypress/fixtures', // папка для фикстур
    integrationFolder: 'cypress/e2e', // папка для тестов
    supportFile: 'cypress/support/e2e.js',
    excludeSpecPattern: ['**/coverage/**'], // исключить папки с покрытием
    defaultCommandTimeout: 8000,
    pageLoadTimeout: 120000,
    env: {},
    setupNodeEvents(on, config) {
      // можно добавить хуки для событий, если потребуется
      return config;
    },
    chromeWebSecurity: false, // если тестируешь CORS
  },
});
