const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  moduleNameMapping: {
    '^@statgpt/imf/(.*)$': '<rootDir>/../../apps/trusted-official-data/$1',
    '^@statgpt/derzhstat/(.*)$':
      '<rootDir>/../../apps/derzhstat-global-data-commons/$1',
    '^@/statgpt/ui-components/(.*)$': '<rootDir>/../../libs/ui-components/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
      },
    ],
  },
  setupFilesAfterEnv: ['./jest.config.js'],
};
