import baseConfig from '../../eslint.config.mjs';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    ignores: ['**/dist', '**/.next'],
  },
  ...baseConfig,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];
