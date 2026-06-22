import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url))
const sourceExtensions = '{js,jsx,mjs,cjs,ts,tsx,mts,cts}'

export default defineConfig({
  test: {
    projects: [
      '**/vite.config.{mjs,js,ts,mts}',
      '**/vitest.config.{mjs,js,ts,mts}',
    ],

    coverage: {
      enabled: true,
      provider: 'v8',

      clean: true,
      cleanOnRerun: true,
      reportOnFailure: true,

      // Always write coverage to the repository root, regardless of whether
      // Vitest is launched directly, through Nx, or from a project folder.
      reportsDirectory: resolve(repositoryRoot, 'coverage'),

      reporter: [
        'text',
        'text-summary',
        'html',
        'json',
        'json-summary',
        'lcov',
      ],

      // In Vitest 4, coverage.include is what makes source files that are not
      // imported by tests appear in the report as uncovered.
      include: [
        `apps/**/*.${sourceExtensions}`,
        `libs/**/*.${sourceExtensions}`,
        `tools/**/*.${sourceExtensions}`,
        `scripts/**/*.${sourceExtensions}`,
        `.github/scripts/**/*.${sourceExtensions}`,
      ],

      exclude: [
        '**/*.d.ts',

        '**/*.config.{js,cjs,mjs,ts,cts,mts}',
        '**/*.test.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
        '**/*.spec.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
        '**/*.stories.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',

        '**/__tests__/**',
        '**/__mocks__/**',
        '**/__fixtures__/**',
        '**/fixtures/**',
        '**/mocks/**',
        '**/test/**',
        '**/tests/**',

        '**/.git/**',
        '**/.next/**',
        '**/.open-next/**',
        '**/.nx/**',
        '**/.turbo/**',
        '**/.wrangler/**',

        '**/artifacts/**',
        '**/coverage/**',
        '**/dist/**',
        '**/node_modules/**',
        '**/tmp/**',
        '**/temp/**',

        '**/*.generated.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
        '**/*.gen.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
      ],
    },
  },
})
