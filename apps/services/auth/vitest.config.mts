import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const workspaceFile = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  root: import.meta.dirname,

  resolve: {
    alias: [
      {
        find: /^@aerealith-ai\/observability\/logger$/,
        replacement: workspaceFile(
          '../../../libs/observability/src/logger/index.ts',
        ),
      },
      {
        find: /^@aerealith-ai\/observability$/,
        replacement: workspaceFile('../../../libs/observability/src/index.ts'),
      },
      {
        find: /^@aerealith-ai\/api-platform$/,
        replacement: workspaceFile('../../../libs/api-platform/src/index.ts'),
      },
      {
        find: /^@aerealith-ai\/authorization$/,
        replacement: workspaceFile('../../../libs/authorization/src/index.ts'),
      },
      {
        find: /^@aerealith-ai\/auth$/,
        replacement: workspaceFile('../../../libs/auth/src/index.ts'),
      },
      {
        find: /^@aerealith-ai\/core$/,
        replacement: workspaceFile('../../../libs/core/src/index.ts'),
      },
      {
        find: /^@aerealith-ai\/db$/,
        replacement: workspaceFile('../../../libs/db/src/index.ts'),
      },
    ],
    tsconfigPaths: true,
  },

  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
  },
});
