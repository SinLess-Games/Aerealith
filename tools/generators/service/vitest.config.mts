import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: 'service-generator',
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: path.resolve(
        import.meta.dirname,
        '../../../coverage/tools/generators/service',
      ),
    },
  },
})
