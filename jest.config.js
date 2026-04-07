module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  testPathIgnorePatterns: ['/test/e2e/'],
  verbose: false,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  globalTeardown: './test/globalTeardown.js',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ]
};
