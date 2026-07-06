import type { Config } from 'prettier'

const config: Config = {
  semi: false,
  singleQuote: true,
  jsxSingleQuote: true,

  tabWidth: 2,
  useTabs: false,

  trailingComma: 'all',
  printWidth: 80,

  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  quoteProps: 'as-needed',
  endOfLine: 'lf',

  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',

  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'preserve',
      },
    },
  ],
}

export default config
