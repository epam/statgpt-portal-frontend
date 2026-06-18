import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  {
    ignores: ['**/dist', '**/jest-env-mocks.ts'],
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
            '@nx/jest',
            'jest',
            '@testing-library/jest-dom',
            '@vitejs/plugin-react',
            'vite-plugin-dts',
            '@storybook/react-vite',
            'flatpickr',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
