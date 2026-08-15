import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
  },
});
