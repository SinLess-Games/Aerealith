/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const FrontendSourceDirectory = 'src'

export default defineConfig({
  root: import.meta.dirname,

  cacheDir: '../../node_modules/.vite/apps/frontend',

  resolve: {
    tsconfigPaths: true,
  },

  plugins: [react()],

  test: {
    name: 'frontend',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: [
      `{${FrontendSourceDirectory},tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`,
    ],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage/apps/frontend',
      reporter: ['text', 'json-summary', 'lcov'],
    },
  },
})
