/// <reference types="vitest" />

import { codecovVitePlugin } from '@codecov/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'


export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,

  cacheDir: '../../node_modules/.vite/apps/frontend',

  resolve: {
    tsconfigPaths: true,
  },

  plugins: [
    react(),
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
}))
