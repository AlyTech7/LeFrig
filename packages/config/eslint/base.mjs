import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/** Flat config base for LeFrig monorepo packages/apps. */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/.expo-web-test/**',
      '**/prisma/migrations/**',
      '**/*.min.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript ya comprueba símbolos indefinidos
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
);
