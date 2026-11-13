import { defineConfig } from 'vitest/config';

// Deliberately NOT extending vite.config.ts: that file registers a dev-only
// middleware which loads the real .env.local (including Square credentials)
// into process.env. Tests must never see those, or the endpoint tests could
// reach a real Square account. Run tests with `npm test` (scripts/test.mjs),
// which also works around a Windows drive-letter casing problem.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
