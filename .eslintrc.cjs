module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  },
  ignorePatterns: ['.next/', 'node_modules/', 'prisma/migrations/', 'next-env.d.ts']
};
