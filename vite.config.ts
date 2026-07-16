import { loadEnvConfig } from '@next/env';
import path from 'path';
import { defineConfig } from 'vitest/config';

// Load env variables from the project root
loadEnvConfig(process.cwd());

export default defineConfig({
  resolve: {
    alias: {
      // Leverages process.cwd() to guarantee safe execution across both CJS & ESM runtimes
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  test: {
    environment: 'node',
    // Use global test functions (no need to import describe/it/expect)
    globals: true,
  },
});
