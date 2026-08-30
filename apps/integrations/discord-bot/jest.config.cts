// Jest runs the bot in Node and maps workspace package aliases directly to
// source so tests do not require a separate library build first.
module.exports = {
  displayName: 'discord-bot',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    // ts-jest reads the bot's strict test configuration for TypeScript files.
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    // These mappings mirror tsconfig path aliases in Jest's resolver.
    '^@aerealith-ai/api-platform$':
      '<rootDir>/../../../libs/api-platform/src/index.ts',
    '^@aerealith-ai/authorization$':
      '<rootDir>/../../../libs/authorization/src/index.ts',
    '^@aerealith-ai/core$': '<rootDir>/../../../libs/core/src/index.ts',
    '^@aerealith-ai/observability$':
      '<rootDir>/../../../libs/observability/src/index.ts',
    '^@aerealith-ai/utils$': '<rootDir>/../../../libs/utils/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/apps/integrations/discord-bot',
};
