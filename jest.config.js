/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: ['src/**/*.*'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
