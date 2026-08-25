import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/api-platform',
  resolve: {
    tsconfigPaths: true,
    alias: {
      graphql: resolve(__dirname, '../../node_modules/graphql/index.js'),
    },
    dedupe: ['graphql'],
  },
  test: {
    name: 'api-platform',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/api-platform',
      provider: 'v8' as const,
    },
  },
}));
