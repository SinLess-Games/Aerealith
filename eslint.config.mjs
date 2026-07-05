import nx from '@nx/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import { globalIgnores } from 'eslint/config'

const workspaceRoot = process.cwd()

export default [
  globalIgnores(
    [
      '**/.git/**',
      '**/.next/**',
      '**/.open-next/**',
      '**/.nx/**',
      '**/.turbo/**',
      '**/.wrangler/**',
      '**/artifacts/**',
      '**/blob-report/**',
      '**/coverage/**',
      '**/dist/**',
      '**/out/**',
      '**/out-tsc/**',
      '**/playwright-report/**',
      '**/storybook-static/**',
      '**/test-results/**',
      '**/node_modules/**',
      '**/.pnpm-store/**',
      '**/tmp/**',
      '**/temp/**',
      '**/logs/**',
      '**/*.generated.*',
      '**/*.gen.*',
      '**/*.map',
      '**/*eslint.config.*',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '**/tools/generators/service/templates/**',
    ],
    'Aerealith generated-file ignores',
  ),
  {
    ignores: ['tools/generators/service/templates/**', '**/*eslint.config.*'],
  },
  {
    files: ['**/*.{ts,tsx,cts,mts,js,jsx,mjs,cjs}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: workspaceRoot,
      },
    },
  },
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/dependency-checks': 'off',
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {
      // Keep code-quality rules here.
      //
      // Do not add formatting rules that Prettier owns, such as:
      // - semi
      // - quotes
      // - indent
      // - comma-dangle
      // - object-curly-spacing
    },
  },
  // Must remain last.
  //
  // This disables ESLint stylistic rules that conflict with Prettier.
  eslintConfigPrettier,
  {
    ignores: ['**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.json'],
    // Override or add rules here
    rules: {},
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
      parserOptions: {
        tsconfigRootDir: process.cwd(),
      },
    },
  },
]
