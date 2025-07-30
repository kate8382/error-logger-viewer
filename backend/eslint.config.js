import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-console': 'off', // для логирования на сервере
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      indent: ['error', 2],
      'no-unused-vars': ['warn'],
      'no-var': 'error',
      'linebreak-style': ['error', 'unix'],
      'keyword-spacing': ['error', { before: true, after: true }],
    }
  }
]);