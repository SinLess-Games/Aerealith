/// <reference types="vitest" />

import meticulous from '@alwaysmeticulous/recorder-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { codecovVitePlugin } from '@codecov/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const meticulousRecordingToken = process.env.METICULOUS_RECORDING_TOKEN

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,

  cacheDir: '../../node_modules/.vite/apps/frontend',

  resolve: {
    tsconfigPaths: true,
  },

  plugins: [
    tailwindcss(),

    react(),

    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: `aerealith-frontend-${mode}`,
      uploadToken: process.env.CODECOV_TOKEN,
    }),

    ...(meticulousRecordingToken
      ? [
          meticulous({
            recordingToken: meticulousRecordingToken,
            enabled: 'always',
          }),
        ]
      : []),
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