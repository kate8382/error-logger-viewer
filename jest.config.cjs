module.exports = {
  // Common settings for all projects
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  projects: [
    {
      displayName: 'frontend',
      rootDir: '.',
      testEnvironment: 'jsdom',
      // Теперь тесты расположены в корне: tests/ui
      roots: ['<rootDir>/tests/ui'],
      testMatch: ['**/*.test.js', '**/*.test.ts', '**/__tests__/**/*.js', '**/__tests__/**/*.ts'],
      // Используем babel-jest для frontend, чтобы поддерживать ES модули и JS тесты
      transform: {
        '^.+\\.jsx?$': 'babel-jest',
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tests/tsconfig.tests.json' }],
      },
      moduleDirectories: ['node_modules', 'frontend/src/scripts'],
    },
    {
      displayName: 'backend',
      rootDir: '.',
      testEnvironment: 'node',
      // Тесты бэкенда теперь в корне: tests/api
      roots: ['<rootDir>/tests/api'],
      testMatch: ['**/*.test.js', '**/*.test.ts', '**/tests/**/*.js', '**/tests/**/*.ts'],
      transform: {
        // Используем babel-jest для JS (ESM) тестов и ts-jest для TypeScript
        '^.+\\.jsx?$': 'babel-jest',
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tests/tsconfig.tests.json' }],
      },
      moduleDirectories: ['node_modules'],
    },
  ],
};
