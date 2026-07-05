// lint-staged.config.ts

export default {
  '*.{js,jsx,ts,tsx,cjs,mjs}': [
    'eslint --fix --ignore-pattern tools/generators/service/templates/** --no-warn-ignored',
    'prettier --write',
  ],
  '*.{css,html,json,jsonc,md,mdx,yaml,yml}': ['prettier --write'],
}
