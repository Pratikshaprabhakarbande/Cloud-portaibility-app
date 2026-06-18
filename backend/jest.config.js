export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  // Exclude process/bootstrap, scripts, and live-SDK integrations (which require
  // real cloud credentials and are not exercised by the offline test suite).
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/index.js',
    'src/seed/',
    'src/config/db.js',
    'src/cloud-adapters/.*Live\\.js'
  ],
  coverageDirectory: 'coverage',
  // Conservative floor — raise as coverage grows. Enforced when run with --coverage.
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 20,
      lines: 25,
      statements: 25
    }
  },
  // In-memory MongoDB startup (download on first run) can be slow in CI.
  testTimeout: 60000,
  verbose: true
};
