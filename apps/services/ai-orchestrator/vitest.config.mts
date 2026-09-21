import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const workspaceFile = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@aerealith-ai/ai-orchestration': workspaceFile(
        '../../../libs/ai-orchestration/src/index.ts',
      ),
    },
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
  },
});
