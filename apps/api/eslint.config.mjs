import base from '@lefrig/config/eslint/base.mjs';

export default [
  ...base,
  {
    ignores: ['dist/**', 'prisma/migrations/**'],
  },
];
