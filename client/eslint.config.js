import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'semi': [ 'error', 'always' ],
    'no-var': [ 'error', ],
    'prefer-const': ['error', { 'destructuring': 'any', 'ignoreReadBeforeAssign': false }],
    'curly': ['error'],
    'eqeqeq': ['error'],
    'no-multi-spaces': ['error'],
    'no-lone-blocks': ['error'],
    'no-self-compare': ['error'],
    'no-useless-call': ['error'],
    'camelcase': ['error', {properties: 'never'}],
    'func-call-spacing': ['error'],
    'no-lonely-if': ['error'],
    'array-bracket-spacing': ['error'],
    'no-console': ['off']
    },
  },
])
