module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 120000,
};
