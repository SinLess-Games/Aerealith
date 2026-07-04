import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'service-generator',
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../../coverage/tools/generators/service',
    },
  },
})
