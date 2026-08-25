import type { UserConfig } from '@commitlint/types'

const commitTypes = [
  'feat',
  'fix',
  'refactor',
  'test',
  'docs',
  'build',
  'ci',
  'chore',
  'perf',
  'style',
  'revert',
  'security',
  'deps',
  'release',
  'wip',
  'hotfix',
] as const

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],

  // Ignore Git-generated merge and revert messages.
  defaultIgnores: true,

  rules: {
    'type-enum': [2, 'always', [...commitTypes]],
    'type-case': [2, 'always', 'lower-case'],

    // Scope is optional and may use any value.
    'scope-empty': [0],
    'scope-enum': [0],
    'scope-case': [2, 'always', 'lower-case'],

    // Allow lowercase or sentence-case subjects without fighting names,
    // acronyms, product names, or technical terminology.
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    'header-max-length': [2, 'always', 100],

    // Bodies and footers are optional and have no length restriction.
    'body-max-length': [0],
    'body-max-line-length': [0],
    'footer-max-length': [0],
    'footer-max-line-length': [0],

    // Support either `!` or a BREAKING CHANGE footer independently.
    'breaking-change-exclamation-mark': [0],
  },
}

export default config
