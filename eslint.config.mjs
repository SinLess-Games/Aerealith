// eslint.config.mjs

import nx from '@nx/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { globalIgnores } from 'eslint/config';

const jsoncParser = (await import('jsonc-eslint-parser')).default;

const workspaceRoot = process.cwd();

const sourceFiles = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.cts',
  '**/*.mts',
  '**/*.js',
  '**/*.jsx',
  '**/*.cjs',
  '**/*.mjs',
];

const reactCompatibilityRules = {
  /**
   * eslint-plugin-react@7.37.5 has ESLint 10 compatibility issues
   * with this rule.
   */
  'react/no-direct-mutation-state': 'off',

  /**
   * TypeScript owns prop validation.
   */
  'react/prop-types': 'off',

  /**
   * React 17+/19 JSX transform.
   */
  'react/react-in-jsx-scope': 'off',
  'react/jsx-uses-react': 'off',
};

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
    ignores: [
      'tools/generators/service/templates/**',
      '**/*eslint.config.*',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },

  {
    files: sourceFiles,

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
    files: sourceFiles,

    rules: {
      '@nx/dependency-checks': 'off',

      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,

          allow: ['^.*/eslint(.base)?.config.[cm]?[jt]s$'],

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
    files: sourceFiles,

    settings: {
      react: {
        /**
         * Avoid eslint-plugin-react version auto-detection issues under ESLint 10.
         * Change this if your installed React version is different.
         */
        version: '19.0',
      },
    },

    rules: {
      // Keep code-quality rules here.
      //
      // Do not add formatting rules that Prettier owns, such as:
      // - semi
      // - quotes
      // - indent
      // - comma-dangle
      // - object-curly-spacing

      ...reactCompatibilityRules,
    },
  },

  {
    files: ['**/*.json'],

    languageOptions: {
      parser: jsoncParser,

      parserOptions: {
        tsconfigRootDir: workspaceRoot,
      },
    },

    rules: {},
  },

  /**
   * Must remain last.
   *
   * This disables ESLint stylistic rules that conflict with Prettier.
   */
  eslintConfigPrettier,
];
