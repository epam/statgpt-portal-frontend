import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  {
    ignores: ['**/dist'],
  },
  ...baseConfig,

  {
    files: ['**/*.json'],
    plugins: {
      '@nx': nx,
    },
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            'vite-plugin-svgr',
            'vite-plugin-static-copy',
            '@nx/vite',
            'vite',
            '@vitejs/plugin-react',
            'vite-plugin-dts',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
