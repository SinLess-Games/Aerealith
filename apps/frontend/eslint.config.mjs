// apps/frontend/eslint.config.mjs

import nx from '@nx/eslint-plugin'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import baseConfig from '../../eslint.config.mjs'

const sourceFiles = ['**/*.{js,jsx,ts,tsx}']
const jsxFiles = ['**/*.{jsx,tsx}']
const testFiles = ['**/*.{spec,test}.{ts,tsx}']

const reactHooksConfig =
  reactHooks.configs['recommended-latest'] ?? reactHooks.configs.recommended

export default [
  ...baseConfig,

  ...nx.configs['flat/react-typescript'],

  {
    files: sourceFiles,

    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    plugins: {
      'react-hooks': reactHooks,
    },

    rules: {
      ...reactHooksConfig.rules,

      /**
       * React 17+ / React 19 JSX transform.
       *
       * React does not need to be imported into every JSX file.
       */
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      /**
       * TypeScript owns component prop validation.
       */
      'react/prop-types': 'off',

      /**
       * Kept disabled because this rule can cause compatibility issues
       * with newer ESLint/plugin combinations and is irrelevant for
       * modern function-component React code.
       */
      'react/no-direct-mutation-state': 'off',
    },
  },

  {
    ...jsxA11y.flatConfigs.recommended,

    files: jsxFiles,

    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
      },
    },

    settings: {
      'jsx-a11y': {
        components: {
          /**
           * Add only UI components that ALWAYS render the matching
           * native HTML element.
           *
           * Example:
           *
           * AerealithButton: 'button',
           * AerealithLink: 'a',
           * AerealithInput: 'input',
           * AerealithSelect: 'select',
           * AerealithTextarea: 'textarea',
           */
        },
      },
    },

    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,

      /**
       * Autofocus creates bad keyboard and screen-reader experiences.
       * Manage focus intentionally in dialogs, forms, and route changes.
       */
      'jsx-a11y/no-autofocus': 'error',

      /**
       * Keep links real links and buttons real buttons.
       */
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
    },
  },

  {
    files: testFiles,

    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.vitest,
      },
    },
  },
]
