import base from '@lefrig/config/eslint/base.mjs';

export default [
  ...base,
  {
    ignores: ['.expo/**', 'dist/**'],
  },
];
