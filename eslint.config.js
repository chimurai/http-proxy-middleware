const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const tseslint = require('typescript-eslint');
const tseslintParser = require('@typescript-eslint/parser');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommended,
  {
    files: ['*.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    ignores: ['dist/*'],
    languageOptions: {
      parser: tseslintParser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { vars: 'all', args: 'none', ignoreRestSiblings: false },
      ],
      'prettier/prettier': 'warn',
    },
    // overrides: [
    //   {
    //     files: ['src/**/*.ts'],
    //     rules: {
    //       'no-restricted-imports': ['error', { paths: ['express'] }],
    //     },
    //   },
    // ],
  },
];
