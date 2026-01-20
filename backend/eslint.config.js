// ESLint flat config for ESLint v9+
export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'consistent-return': 'warn',
      curly: ['error', 'multi-line'],
      eqeqeq: ['error', 'always'],
      'no-magic-numbers': [
        'warn',
        { ignore: [0, 1, 2, 7], ignoreArrayIndexes: true, enforceConst: true },
      ],
      'max-depth': ['warn', 3],
      complexity: ['warn', { max: 10 }],
      'prefer-const': 'error',
    },
  },
];
