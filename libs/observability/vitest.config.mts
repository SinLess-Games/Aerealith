import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/observability',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'observability',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/observability',
      provider: 'v8' as const,
      // Measure every production module, including files no test imports yet.
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{spec,test}.ts', 'src/**/*.d.ts'],
      reporter: ['text', 'json-summary', 'json', 'lcov', 'html'],
      // CI must retain at least 80% across every standard coverage measure.
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
}));
