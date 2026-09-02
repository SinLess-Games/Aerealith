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
    // Source tests resolve the explicit .js suffix used by emitted dynamic
    // imports back to the TypeScript module Jest transforms in-place.
    '^(\\.{1,2}/.*)\\.js$': '$1',
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
  // Include untouched production modules so coverage cannot be inflated by
  // only reporting files that an existing test happened to import.
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.{spec,test}.ts',
    '!<rootDir>/src/**/*.d.ts',
  ],
  // Shared libraries have their own coverage gate; this report owns bot code.
  coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/../../../libs/'],
  coverageReporters: ['text', 'json-summary', 'json', 'lcov', 'html'],
  // Fail the test target if any global coverage measure drops below 80%.
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  coverageDirectory: '../../../coverage/apps/integrations/discord-bot',
};
