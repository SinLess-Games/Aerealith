// apps/frontend/eslint.config.mjs

import nx from '@nx/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import baseConfig from '../../eslint.config.mjs';

const sourceFiles = ['**/*.{js,jsx,ts,tsx}'];
const jsxFiles = ['**/*.{jsx,tsx}'];
const testFiles = ['**/*.{spec,test}.{ts,tsx}'];

const reactHooksConfig =
  reactHooks.configs['recommended-latest'] ?? reactHooks.configs.recommended;

export default [
  ...baseConfig,

  {
    ignores: ['**/*.json', '**/*.jsonc'],
  },

  ...nx.configs['flat/react-typescript'],

  {
    files: sourceFiles,

    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },

    settings: {
      react: {
        version: '19.0',
      },
    },

    plugins: {
      'react-hooks': reactHooks,
    },

    rules: {
      ...reactHooksConfig.rules,

      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react/no-direct-mutation-state': 'off',
    },
  },

  {
    ...jsxA11y.flatConfigs.recommended,

    files: jsxFiles,

    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,

      globals: {
        ...globals.browser,
      },
    },

    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,

      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
    },
  },

  {
    files: testFiles,

    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
];
