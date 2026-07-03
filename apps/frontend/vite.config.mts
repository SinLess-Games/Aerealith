/// <reference types="vitest" />

import { cloudflare } from '@cloudflare/vite-plugin'
import { codecovVitePlugin } from '@codecov/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const FrontendSourceDirectory = 'src'
const WorkerEnvironmentName = 'aerealith'

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,

  cacheDir: '../../node_modules/.vite/apps/frontend',

  // Vite 8 resolves tsconfig path aliases natively.
  // Do not use vite-tsconfig-paths here.
  resolve: {
    tsconfigPaths: true,
  },

  // Nx loads this config while discovering Vitest targets. Vitest adds Node
  // built-ins to resolve.external, but Cloudflare Workers must bundle Worker
  // dependencies instead of externalizing them. Keep this Worker environment
  // explicitly empty so the Cloudflare Vite plugin can validate it.
  environments: {
    [WorkerEnvironmentName]: {
      resolve: {
        external: [],
      },
    },
  },

  plugins: [
    react(),
    cloudflare(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: `aerealith-frontend-${mode}`,
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],

  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
  },

  preview: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
  },

  build: {
    outDir: '../../dist/apps/frontend',
    emptyOutDir: true,
    reportCompressedSize: true,
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

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
}))
