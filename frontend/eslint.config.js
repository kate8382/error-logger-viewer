// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import jestPlugin from 'eslint-plugin-jest'; // установили плагин, т.к. в проекте используются тесты на Jest
import prettierPlugin from 'eslint-plugin-prettier'; // плагин для запуска Prettier как правила ESLint
import prettierConfig from 'eslint-config-prettier/flat'; // конфиг для отключения конфликтующих правил (flat)
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { globals: globals.browser },
    plugins: { prettier: prettierPlugin },
    rules: {
      'no-console': 'off',
      'func-names': 'off',
      'spaced-comment': ['error', 'always'],
      'no-inline-comments': 'off',
      'multiline-comment-style': 'off',
      // Let Prettier control quote style; disable ESLint's quotes rule
      quotes: 'off',
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
      'no-param-reassign': ['off'], // отключение правила, запрещающего переназначение параметров функции
      'prefer-const': 'off', // отключение правила, требующего использование const
      'no-undef': 'off', // отключение правила, запрещающего использование не объявленных переменных
      'no-restricted-syntax': 'off', // отключение ограничения на определённые синтаксические конструкции
      'import/no-extraneous-dependencies': 'off', // отключение правила, запрещающего использование неуказанных в package.json зависимостей
      'prettier/prettier': ['warn', { singleQuote: true, endOfLine: 'auto' }], // Prettier: использовать одинарные кавычки и автоопределение конца строки
    },
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
      },
    },
  },
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'], // все тестовые файлы
    env: { 'jest/globals': true }, // устанавливаем окружение Jest
    languageOptions: { globals: globals.jest }, // добавляем глобальные переменные Jest
    plugins: { jest: jestPlugin }, // подключаем плагин eslint-plugin-jest
    rules: {
      'jest/no-disabled-tests': 'warn', // предупреждение для отключённых тестов
      'jest/no-focused-tests': 'error', // ошибка для focused тестов
      'jest/no-identical-title': 'error', // ошибка для тестов с одинаковыми названиями
      'jest/valid-expect': 'error', // проверка правильности использования expect
      'jest/no-test-return-statement': 'warn', // предупреждение для return в тестах
    },
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
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  // Prettier config должен быть последним, чтобы он мог отключить правила форматирования, которые конфликтуют с Prettier
  prettierConfig,
]);
