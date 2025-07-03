import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.GROQ_API_KEY': JSON.stringify('test-groq-api-key'),
    'import.meta.env.BETTER_AUTH_SECRET': JSON.stringify('test-secret-that-is-at-least-32-characters-long-for-testing'),
    'import.meta.env.BETTER_AUTH_URL': JSON.stringify('http://localhost:4321'),
    'import.meta.env.NODE_ENV': JSON.stringify('test'),
    'import.meta.env.USE_LOCAL_DB': JSON.stringify('true'),
  },
});