export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  // In-memory MongoDB startup (download on first run) can be slow in CI.
  testTimeout: 60000,
  verbose: true
};
