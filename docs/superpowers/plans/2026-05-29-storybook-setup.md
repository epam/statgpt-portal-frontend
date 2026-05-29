# Storybook Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Storybook v10 app at `apps/storybook/` as an Nx project, with Tailwind CSS via Vite postcss, a runtime brand switcher (CSS variable overrides), and a first story for `InlineAlert`.

**Architecture:** Single Storybook app using `@storybook/react-vite`. Vite processes SCSS + Tailwind via a postcss configuration in `viteFinal` — no separate compile step needed. Stories live co-located with components in `libs/`. Brand switching injects a `<link>` tag in a decorator; theme CSS files are served as static assets.

**Tech Stack:** Storybook 10, `@storybook/react-vite`, Vite 7, Tailwind CSS 3, Sass, `vite-plugin-svgr`, Nx `run-commands` executor.

---

## File Map

**Create:**
- `apps/storybook/project.json` — Nx project config (storybook + build-storybook targets)
- `apps/storybook/tsconfig.json` — TS config extending `tsconfig.base.json`
- `apps/storybook/tailwind.config.js` — Tailwind config; content globs into all libs
- `apps/storybook/.storybook/main.ts` — story glob, addons, viteFinal (path aliases, postcss, svgr), staticDirs
- `apps/storybook/.storybook/preview.tsx` — base CSS import, brand decorator, toolbar global
- `apps/storybook/.storybook/themes/brand1.css` — `:root` overrides with current variable values
- `apps/storybook/.storybook/themes/brand2.css` — placeholder copy of brand1.css
- `libs/ui-components/src/components/InlineAlert/InlineAlert.stories.tsx` — 5 named stories

**Modify:**
- `package.json` — add 6 Storybook devDependencies + `"storybook"` npm script

---

## Task 1: Install Storybook packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install devDependencies**

```bash
npm install --save-dev \
  storybook@^10.4.1 \
  @storybook/react-vite@^10.4.1 \
  @storybook/addon-docs@^10.4.1 \
  @storybook/addon-a11y@^10.4.1 \
  storybook-addon-pseudo-states@^10.3.6 \
  eslint-plugin-storybook@^10.2.17
```

Expected: exits 0, `package.json` devDependencies now include all six packages.

- [ ] **Step 2: Add `storybook` npm script to `package.json`**

In the `"scripts"` block, add after the `"start"` line:

```json
"storybook": "nx run storybook:storybook",
```

- [ ] **Step 3: Verify packages installed**

```bash
ls node_modules/storybook node_modules/@storybook/react-vite
```

Expected: both directories exist.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add storybook v10 packages"
```

---

## Task 2: Scaffold Nx storybook project

**Files:**
- Create: `apps/storybook/project.json`
- Create: `apps/storybook/tsconfig.json`
- Create: `apps/storybook/tailwind.config.js`

- [ ] **Step 1: Create `apps/storybook/project.json`**

```json
{
  "name": "storybook",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/storybook",
  "tags": ["type:app", "scope:storybook"],
  "targets": {
    "storybook": {
      "executor": "nx:run-commands",
      "options": {
        "command": "storybook dev -p 6006 --config-dir apps/storybook/.storybook"
      }
    },
    "build-storybook": {
      "executor": "nx:run-commands",
      "options": {
        "command": "storybook build --config-dir apps/storybook/.storybook --output-dir dist/storybook"
      }
    }
  }
}
```

- [ ] **Step 2: Create `apps/storybook/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": [".storybook/**/*.ts", ".storybook/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `apps/storybook/tailwind.config.js`**

This is a copy of `apps/portals-example/tailwind.config.js` with the `content` array updated to glob the libs from this project's location. The two tailwind configs are completely independent.

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../../libs/**/src/**/*!(*.stories|*.spec).{ts,tsx,html}',
    './.storybook/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        '2xl': { max: '1919px' },
        xl: { max: '1536px' },
        lg: { max: '1279px' },
        'lg-min': { min: '1280px' },
        md: { max: '1023px' },
        'md-min': { min: '1024px' },
        'sm-explorer': { max: '998px' },
        sm: { max: '719px' },
        'sm-min': { min: '720px' },
        xs: { max: '428px' },
        'xs-min': { min: '429px' },
      },
      colors: {
        primary: 'var(--primary, #414FFF)',
        white: 'var(--white, #FFFFFF)',
        blackout: 'var(--blackout, #090D13B3)',
        neutrals: {
          1000: 'var(--neutrals-1000, #2B2B2D)',
          900: 'var(--neutrals-900, #3F404A)',
          800: 'var(--neutrals-800, #757575)',
          700: 'var(--neutrals-700, #89898B)',
          600: 'var(--neutrals-600, #CFCFCF)',
          500: 'var(--neutrals-500, #DDDFE8)',
          400: 'var(--neutrals-400, #E9EEF6)',
          300: 'var(--neutrals-300, #F0F4F8)',
          200: 'var(--neutrals-200, #F3F5FF)',
          100: 'var(--neutrals-100, #F3F6FB)',
        },
        hues: {
          900: 'var(--hues-900, #0D2282)',
          800: 'var(--hues-800, #354487)',
          600: 'var(--hues-600, #9DA4FF)',
          400: 'var(--hues-400, #B1B7FF)',
          200: 'var(--hues-200, #CBD0FF)',
          100: 'var(--hues-100, #DFE6FF)',
        },
        accent: {
          700: 'var(--accent-700, #0094FF)',
          300: 'var(--accent-300, #90A1FF)',
        },
        semantic: {
          error: 'var(--semantic-error, #D6323E)',
          'error-light': 'var(--semantic-error-light, #FBEAEC)',
          warning: 'var(--semantic-warning, #D4C000)',
          'warning-light': 'var(--semantic-warning-light, #FBF9E5)',
          success: 'var(--semantic-success, #00CC6F)',
        },
        gradients: {
          light: 'var(--gradients-light, #73E1E5)',
          middle: 'var(--gradients-middle, #414FFF)',
          dark: 'var(--gradients-dark, #6843E9)',
          white10: 'var(--white10, #FFFFFF1A)',
          neutrals300: 'var(--neutrals-300-10, #F0F4F81A)',
        },
        highlight: 'var(--highlight, #BEDAFF)',
      },
      zIndex: {
        tooltip: '100000',
        modal: '100001',
        dropdown: '100002',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
```

- [ ] **Step 4: Verify Nx recognises the project**

```bash
npx nx show project storybook
```

Expected: prints the project config including `storybook` and `build-storybook` targets.

- [ ] **Step 5: Commit**

```bash
git add apps/storybook/project.json apps/storybook/tsconfig.json apps/storybook/tailwind.config.js
git commit -m "chore: scaffold apps/storybook Nx project"
```

---

## Task 3: Configure Storybook core

**Files:**
- Create: `apps/storybook/.storybook/main.ts`
- Create: `apps/storybook/.storybook/themes/brand1.css`
- Create: `apps/storybook/.storybook/themes/brand2.css`
- Create: `apps/storybook/.storybook/preview.tsx`

- [ ] **Step 1: Create `apps/storybook/.storybook/main.ts`**

`viteFinal` configures postcss with tailwindcss (pointing to the storybook-specific config) and autoprefixer. Both are loaded via `require` to avoid ESM/CJS interop issues. `staticDirs` maps `.storybook/themes/` to the `/brand-themes/` URL used by the brand decorator.

```ts
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import path from 'path';

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
  staticDirs: [{ from: './themes', to: '/brand-themes' }],
  async viteFinal(baseConfig) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tailwindcss = require('tailwindcss');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const autoprefixer = require('autoprefixer');
    return mergeConfig(baseConfig, {
      plugins: [svgr()],
      css: {
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
```

- [ ] **Step 2: Create `apps/storybook/.storybook/themes/brand1.css`**

These values are the current defaults from `apps/portals-example/tailwind.config.js`. With Brand 1 active, all CSS variables resolve to these exact values (overriding the fallbacks in the Tailwind config).

```css
:root {
  --primary: #414FFF;
  --white: #FFFFFF;
  --blackout: #090D13B3;
  --neutrals-1000: #2B2B2D;
  --neutrals-900: #3F404A;
  --neutrals-800: #757575;
  --neutrals-700: #89898B;
  --neutrals-600: #CFCFCF;
  --neutrals-500: #DDDFE8;
  --neutrals-400: #E9EEF6;
  --neutrals-300: #F0F4F8;
  --neutrals-200: #F3F5FF;
  --neutrals-100: #F3F6FB;
  --hues-900: #0D2282;
  --hues-800: #354487;
  --hues-600: #9DA4FF;
  --hues-400: #B1B7FF;
  --hues-200: #CBD0FF;
  --hues-100: #DFE6FF;
  --accent-700: #0094FF;
  --accent-300: #90A1FF;
  --semantic-error: #D6323E;
  --semantic-error-light: #FBEAEC;
  --semantic-warning: #D4C000;
  --semantic-warning-light: #FBF9E5;
  --semantic-success: #00CC6F;
  --gradients-light: #73E1E5;
  --gradients-middle: #414FFF;
  --gradients-dark: #6843E9;
  --white10: #FFFFFF1A;
  --neutrals-300-10: #F0F4F81A;
  --highlight: #BEDAFF;
}
```

- [ ] **Step 3: Create `apps/storybook/.storybook/themes/brand2.css`**

Placeholder copy of brand1.css. Replace these values when real client 2 brand values are available.

```css
/* Brand 2 — replace values below with client 2 brand colours */
:root {
  --primary: #414FFF;
  --white: #FFFFFF;
  --blackout: #090D13B3;
  --neutrals-1000: #2B2B2D;
  --neutrals-900: #3F404A;
  --neutrals-800: #757575;
  --neutrals-700: #89898B;
  --neutrals-600: #CFCFCF;
  --neutrals-500: #DDDFE8;
  --neutrals-400: #E9EEF6;
  --neutrals-300: #F0F4F8;
  --neutrals-200: #F3F5FF;
  --neutrals-100: #F3F6FB;
  --hues-900: #0D2282;
  --hues-800: #354487;
  --hues-600: #9DA4FF;
  --hues-400: #B1B7FF;
  --hues-200: #CBD0FF;
  --hues-100: #DFE6FF;
  --accent-700: #0094FF;
  --accent-300: #90A1FF;
  --semantic-error: #D6323E;
  --semantic-error-light: #FBEAEC;
  --semantic-warning: #D4C000;
  --semantic-warning-light: #FBF9E5;
  --semantic-success: #00CC6F;
  --gradients-light: #73E1E5;
  --gradients-middle: #414FFF;
  --gradients-dark: #6843E9;
  --white10: #FFFFFF1A;
  --neutrals-300-10: #F0F4F81A;
  --highlight: #BEDAFF;
}
```

- [ ] **Step 4: Create `apps/storybook/.storybook/preview.tsx`**

The `withBrand` decorator runs inside Storybook's preview iframe, so `document` refers to the iframe's document — `document.head.appendChild` correctly targets the preview, not the Storybook shell.

```tsx
import React, { useEffect } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import '../../../libs/ui-components/src/scss/styles.scss';

const withBrand: Decorator = (Story, context) => {
  const brand = (context.globals.brand as string) ?? 'brand1';
  useEffect(() => {
    const existing = document.getElementById('brand-theme');
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.id = 'brand-theme';
    link.rel = 'stylesheet';
    link.href = `/brand-themes/${brand}.css`;
    document.head.appendChild(link);
  }, [brand]);
  return <Story />;
};

const preview: Preview = {
  decorators: [withBrand],
  globalTypes: {
    brand: {
      description: 'Client brand',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'brand1', title: 'Brand 1' },
          { value: 'brand2', title: 'Brand 2' },
        ],
      },
    },
  },
  initialGlobals: {
    brand: 'brand1',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

- [ ] **Step 5: Verify Storybook starts**

```bash
npm run storybook
```

Expected: terminal shows `Storybook ... started` and browser opens `http://localhost:6006`. The UI loads with "No stories found." No console errors. The paintbrush toolbar icon is visible. Stop with `Ctrl+C`.

- [ ] **Step 6: Commit**

```bash
git add apps/storybook/.storybook/
git commit -m "feat: add Storybook core config with brand theme switcher"
```

---

## Task 4: Add InlineAlert story

**Files:**
- Create: `libs/ui-components/src/components/InlineAlert/InlineAlert.stories.tsx`

- [ ] **Step 1: Create `libs/ui-components/src/components/InlineAlert/InlineAlert.stories.tsx`**

`WithIcon` uses `IconInfoCircle` from `@tabler/icons-react` (already a project dependency). The `'use client'` directive in `InlineAlert.tsx` is silently ignored by Vite — no change needed to the source file.

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconInfoCircle } from '@tabler/icons-react';
import React from 'react';
import { InlineAlert } from './InlineAlert';
import { InlineAlertType } from './types';

const meta: Meta<typeof InlineAlert> = {
  title: 'UI Components/InlineAlert',
  component: InlineAlert,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InlineAlert>;

export const InfoStory: Story = {
  name: 'Info',
  args: {
    type: InlineAlertType.Info,
    children: 'Informational message for the user.',
  },
};

export const ErrorStory: Story = {
  name: 'Error',
  args: {
    type: InlineAlertType.Error,
    children: 'Something went wrong. Please try again.',
  },
};

export const WarningStory: Story = {
  name: 'Warning',
  args: {
    type: InlineAlertType.Warning,
    children: 'Please review this warning before continuing.',
  },
};

export const NoteStory: Story = {
  name: 'Note',
  args: {
    type: InlineAlertType.Note,
    children: 'A helpful note for the user.',
  },
};

export const WithIcon: Story = {
  name: 'With Icon',
  args: {
    type: InlineAlertType.Info,
    icon: <IconInfoCircle size={16} />,
    children: 'Info message with an icon.',
  },
};
```

- [ ] **Step 2: Start Storybook and verify stories appear**

```bash
npm run storybook
```

Expected: Sidebar shows `UI Components > InlineAlert` with five entries: Info, Error, Warning, Note, With Icon. Each renders the component with correct border colour and background.

- [ ] **Step 3: Verify brand switcher works**

In the running Storybook, click the paintbrush icon in the toolbar and switch between **Brand 1** and **Brand 2**. Expected: no errors in the browser console; the active story re-renders (Brand 2 looks identical to Brand 1 for now since it's a placeholder).

- [ ] **Step 4: Stop Storybook and commit**

```bash
git add libs/ui-components/src/components/InlineAlert/InlineAlert.stories.tsx
git commit -m "feat: add InlineAlert stories to Storybook"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** project structure ✓, Nx targets ✓, `npm run storybook` script ✓, tailwind config ✓, viteFinal with postcss + path aliases ✓, staticDirs ✓, brand1/brand2 CSS ✓, brand decorator ✓, toolbar global ✓, InlineAlert stories (5 variants) ✓, `'use client'` note ✓, no `@nx/storybook` ✓, stories co-located ✓
- [x] **Placeholder scan:** all steps have full file contents or exact commands — no TBD/TODO
- [x] **Type consistency:** `Meta<typeof InlineAlert>`, `StoryObj<typeof InlineAlert>`, `Decorator`, `Preview` all from `@storybook/react-vite` — consistent throughout
