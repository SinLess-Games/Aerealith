// lint-staged.config.ts

export default {
  '*.{js,jsx,ts,tsx,cjs,mjs}': ['eslint --fix', 'prettier --write'],
  '*.{css,html,json,jsonc,md,mdx,yaml,yml}': ['prettier --write'],
}
