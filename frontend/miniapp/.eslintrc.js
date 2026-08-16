/*
 * Eslint config file
 * Documentation: https://eslint.org/docs/user-guide/configuring/
 * Install the Eslint extension before using this feature.
 */
module.exports = {
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  globals: {
    wx: true,
    App: true,
    Page: true,
    getCurrentPages: true,
    getApp: true,
    Component: true,
    Behavior: true,
    requirePlugin: true,
    requireMiniProgram: true,
    globalThis: true,
    IAppOption: true,
    WechatMiniprogram: true,
  },
  extends: 'eslint:recommended',
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-throw-literal': 'error',
    'no-constant-binary-expression': 'error',
    'no-duplicate-imports': 'error',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
  },
  ignorePatterns: ['miniprogram_npm/**'],
};
