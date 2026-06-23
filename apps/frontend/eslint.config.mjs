import nx from '@nx/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import baseConfig from '../../eslint.config.mjs'

export default [
  ...baseConfig,

  ...nx.configs['flat/react-typescript'],

  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Keep React 17+/19 JSX sane.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Avoid ESLint 10 crash from eslint-plugin-react.
      'react/no-direct-mutation-state': 'off',
      'react/prop-types': 'off',
    },
  },
]
