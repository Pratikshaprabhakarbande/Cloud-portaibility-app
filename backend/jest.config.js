export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  // Exclude process/bootstrap and one-off scripts from coverage accounting.
  coveragePathIgnorePatterns: ['/node_modules/', 'src/index.js', 'src/seed/', 'src/config/db.js'],
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
