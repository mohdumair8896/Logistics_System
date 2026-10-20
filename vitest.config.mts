import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // Tests run against in-process Postgres (PGlite) with the real migrations, never DATABASE_URL.
    env: {
      AUTH_SECRET: 'test-only-secret-that-is-at-least-32-characters-long',
      DB_RLS_ROLE: process.env.DB_RLS_ROLE ?? 'app_rls', // set DB_RLS_ROLE= to test without RLS
      DATABASE_URL: 'postgres://unused-in-tests',
    },
  },
});
