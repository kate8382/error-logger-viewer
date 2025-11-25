/* eslint-env node */
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://192.168.31.198:8080', // адрес фронта
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
