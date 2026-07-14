import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['**/.next/**', '**/dist/**', '**/node_modules/**'],
  },

  eslint.configs.recommended,

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-undef': 'off',
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  {
    plugins: {
      '@next/next': nextPlugin,
    },
    settings: {
      next: {
        rootDir: '.',
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  prettierConfig,
];
