import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: ['../../../libs/**/src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    'storybook-addon-pseudo-states',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: [
    { from: './themes', to: '/brand-themes' },
    { from: '../brand-assets/brand1', to: '/brand-assets/brand1' },
  ],
  async viteFinal(baseConfig) {
    const { default: tailwindcss } = await import('tailwindcss');
    const { default: autoprefixer } = await import('autoprefixer');
    return mergeConfig(baseConfig, {
      plugins: [svgr({ include: '**/*.svg' })],
      css: {
        preprocessorOptions: {
          scss: {
            silenceDeprecations: ['import'],
          },
        },
        postcss: {
          plugins: [
            tailwindcss(path.resolve(__dirname, '../tailwind.config.js')),
            autoprefixer(),
          ],
        },
      },
      resolve: {
        alias: {
          '@epam/statgpt-conversation-list': path.resolve(
            __dirname,
            '../../../libs/conversation-list/src/index.ts',
          ),
          '@epam/statgpt-conversation-view': path.resolve(
            __dirname,
            '../../../libs/conversation-view/src/index.ts',
          ),
          '@epam/statgpt-dial-toolkit': path.resolve(
            __dirname,
            '../../../libs/dial-toolkit/src/index.ts',
          ),
          '@epam/statgpt-sdmx-toolkit': path.resolve(
            __dirname,
            '../../../libs/sdmx-toolkit/src/index.ts',
          ),
          '@epam/statgpt-shared-toolkit': path.resolve(
            __dirname,
            '../../../libs/shared-toolkit/src/index.ts',
          ),
          '@epam/statgpt-ui-components/scss/styles.scss': path.resolve(
            __dirname,
            '../../../libs/ui-components/src/scss/styles.scss',
          ),
          '@epam/statgpt-ui-components': path.resolve(
            __dirname,
            '../../../libs/ui-components/src/index.ts',
          ),
          // @statgpt/* libs use TypeScript wildcard aliases (e.g. '@statgpt/download-panel/*')
          // which Vite does not support as plain strings. Uncomment the entries below
          // when a story first imports from one of these libs:
          // { find: /^@statgpt\/share-conversation\/(.+)/, replacement: path.resolve(__dirname, '../../../libs/share-conversation/$1') },
          // { find: /^@statgpt\/download-panel\/(.+)/, replacement: path.resolve(__dirname, '../../../libs/download-panel/$1') },
          // { find: /^@statgpt\/user-info\/(.+)/, replacement: path.resolve(__dirname, '../../../libs/user-info/$1') },
        },
      },
    });
  },
};

export default config;
