import { loadEnvConfig } from '@next/env';
import path from 'path';
import { defineConfig } from 'vitest/config';

loadEnvConfig(process.cwd());

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**'],
  },
});
