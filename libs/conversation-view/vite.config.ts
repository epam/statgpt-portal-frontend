/// <reference types='vitest' />
import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import svgr from 'vite-plugin-svgr';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import packageJson from './package.json';

const { dependencies, peerDependencies } = {
  dependencies: {},
  peerDependencies: {},
  ...packageJson,
};

const externalDependencies = [
  ...Object.keys(dependencies),
  ...Object.keys(peerDependencies),
];

const isExternalDependency = (id: string) =>
  externalDependencies.some(
    (dependency) => id === dependency || id.startsWith(`${dependency}/`),
  );

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/conversation-view',

  plugins: [
    react(),
    nxViteTsPaths(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
    svgr({
      include: '**/*.svg',
      svgrOptions: { exportType: 'default' },
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'README.md',
          dest: '',
        },
        {
          src: '../../LICENSE',
          dest: '',
        },
      ],
    }),
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: '../../dist/libs/conversation-view',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'src/index.ts',
      name: 'conversation-view',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: isExternalDependency,
    },
  },
} as UserConfig);
