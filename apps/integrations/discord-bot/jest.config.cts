module.exports = {
  displayName: 'discord-bot',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
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
