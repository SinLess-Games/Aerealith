import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir,
      },
    },
    rules: {},
  },
];
