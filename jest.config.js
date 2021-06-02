const esModules = ['is-plain-obj'].join('|');

module.exports = {
  preset: 'ts-jest',
  transform: {
    [`(${esModules}).+\\.js$`]: 'ts-jest',
  },
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  testEnvironment: 'node',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: ['src/**/*.*'],
};
