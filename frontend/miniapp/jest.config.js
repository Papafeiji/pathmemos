/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  // 为小程序代码注入最小全局 wx mock，保证 import 与基础 API 调用不崩溃。
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
};
