import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const workspaceFile = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  root: import.meta.dirname,

  resolve: {
    alias: {
      '@aerealith-ai/core': workspaceFile('../../../libs/core/src/index.ts'),
      '@aerealith-ai/db': workspaceFile('../../../libs/db/src/index.ts'),
      '@aerealith-ai/observability': workspaceFile(
        '../../../libs/observability/src/index.ts',
      ),
      '@aerealith-ai/observability/logger': workspaceFile(
        '../../../libs/observability/src/logger/index.ts',
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
