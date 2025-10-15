// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import jestPlugin from 'eslint-plugin-jest'; // установили плагин, т.к. в проекте используются тесты на Jest
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-console': 'off',
      'func-names': 'off',
      'spaced-comment': ['error', 'always'],
      'no-inline-comments': 'off',
      'multiline-comment-style': 'off',
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'no-unused-vars': ['warn'],
      indent: ['error', 2],
      'no-var': 'error',
      'linebreak-style': ['error', 'unix'],
      'keyword-spacing': ['error', { before: true, after: true }],
      'no-restricted-globals': 'off',
      'no-alert': 'off',
      'no-plusplus': 'off',
      'max-len': 'off', // отключено ограничение длины строки
      'no-param-reassign': ['off'],
    }
  },
  {
    files: ['webpack.config.js', 'cypress.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'no-undef': 'off',
      'no-restricted-syntax': 'off',
      'import/no-extraneous-dependencies': 'off',
    }
  },
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'], // все тестовые файлы
    languageOptions: { globals: globals.jest }, // добавляем глобальные переменные Jest
    plugins: { jest: jestPlugin }, // подключаем плагин eslint-plugin-jest
    rules: {
      'jest/no-disabled-tests': 'warn', // предупреждение для отключённых тестов
      'jest/no-focused-tests': 'error', // ошибка для focused тестов
      'jest/no-identical-title': 'error', // ошибка для тестов с одинаковыми названиями
      'jest/valid-expect': 'error', // проверка правильности использования expect
      'jest/no-test-return-statement': 'warn' // предупреждение для return в тестах
    }
  },
  {
    files: ['cypress/e2e/**/*.js', '**/*.cy.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        cy: 'readonly',
      }
    },
    rules: {
      'no-undef': 'off',
    }
  }
]);
