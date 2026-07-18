import base from '@lefrig/config/eslint/base.mjs';

export default [
  {
    ignores: ['.expo/**', '.expo-web-test/**', 'dist/**', 'android/**', 'ios/**'],
  },
  ...base,
];
