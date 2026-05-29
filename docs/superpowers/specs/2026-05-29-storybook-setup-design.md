# Storybook Setup — Design Spec

**Date:** 2026-05-29  
**Status:** Approved

## Goal

Add Storybook as a runnable Nx project (`apps/storybook/`) in the monorepo, starting with an `InlineAlert` story from `libs/ui-components`. Support runtime brand switching (CSS variable overrides) so both clients can be previewed in one running instance.

---

## Architecture

### Project location

```
apps/
  storybook/
    .storybook/
      main.ts          ← story glob, viteFinal (path aliases, postcss, svgr)
      preview.tsx      ← import base CSS, brand decorator, toolbar globals
      themes/
        brand1.css     ← :root { --primary: #414FFF; ... } (current values)
        brand2.css     ← :root { --primary: ???; ... } (placeholder for client 2)
    tailwind.config.js ← adapted from portals-example; content globs all libs
    tsconfig.json      ← extends ../../tsconfig.base.json
    project.json       ← nx targets: storybook (dev), build-storybook
```

- No `@nx/storybook` executor — `project.json` uses `nx:run-commands` calling `storybook dev` directly.
- No `package.json` inside `apps/storybook/` — all deps go in root `package.json`.
- Stories co-located with components in `libs/`, not inside the app.

### Nx targets

```jsonc
// apps/storybook/project.json
{
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

### Root npm script

```json
"storybook": "nx run storybook:storybook"
```

---

## Styling pipeline

Vite handles SCSS + Tailwind via postcss in `viteFinal` — no separate compile step or `concurrently` needed.

Theme CSS files are served as static assets via `staticDirs` in `main.ts`:

```ts
staticDirs: [{ from: '../.storybook/themes', to: '/brand-themes' }],
```

This makes `brand1.css` available at `/brand-themes/brand1.css` inside the preview iframe.

```ts
// .storybook/main.ts — viteFinal
return mergeConfig(config, {
  plugins: [svgr()],
  css: {
    postcss: {
      plugins: [tailwindcss(require('../tailwind.config.js'))],
    },
  },
  resolve: {
    alias: {
      '@epam/statgpt-ui-components': path.resolve('libs/ui-components/src/index'),
      // ... all paths from tsconfig.base.json
    },
  },
});
```

`preview.tsx` imports the existing SCSS entry directly:

```ts
import '../../../libs/ui-components/src/scss/styles.scss';
```

`apps/storybook/tailwind.config.js` is a copy of `portals-example/tailwind.config.js` with `content` updated:

```js
content: [
  '../../libs/**/src/**/*!(*.stories|*.spec).{ts,tsx,html}',
  '.storybook/**/*.{ts,tsx}',
]
```

`apps/portals-example/tailwind.config.js` is not modified.

---

## Brand / theme switching

CSS variable override files define `:root` values per brand:

```css
/* .storybook/themes/brand1.css */
:root {
  --primary: #414FFF;
  --white: #FFFFFF;
  --neutrals-1000: #2B2B2D;
  /* ... all variables from tailwind.config.js */
}
```

A Storybook global `brand` drives which file is active. A decorator in `preview.tsx` injects the correct CSS into the preview iframe on every story render:

```tsx
// preview.tsx
const withBrand: Decorator = (Story, context) => {
  const brand = context.globals.brand ?? 'brand1';
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
```

Toolbar dropdown:

```ts
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
```

Phase 1: `brand1.css` has real values (current `tailwind.config.js` defaults). `brand2.css` is a placeholder copy — the switcher works end-to-end, client 2 values filled in later.

---

## Story conventions

Stories are co-located with components in `libs/`:

```
libs/ui-components/src/components/InlineAlert/
  InlineAlert.tsx
  InlineAlert.spec.tsx       ← existing
  InlineAlert.stories.tsx    ← new
  InlineAlertContext.tsx
  types.ts
```

Story glob in `main.ts`:
```ts
stories: ['../../../libs/**/src/**/*.stories.@(ts|tsx)']
```

### InlineAlert stories (Phase 1)

Named exports covering each `InlineAlertType` variant plus icon usage:

- `InfoStory` — `InlineAlertType.Info`
- `ErrorStory` — `InlineAlertType.Error`
- `WarningStory` — `InlineAlertType.Warning`
- `NoteStory` — `InlineAlertType.Note`
- `WithIcon` — `InlineAlertType.Info` + `icon` prop via `@tabler/icons-react`

The `'use client'` directive in `InlineAlert.tsx` is harmless in Vite/Storybook — source file is not modified.

---

## Dependencies added (root devDependencies)

```
storybook
@storybook/react-vite
@storybook/addon-docs
@storybook/addon-a11y
storybook-addon-pseudo-states
eslint-plugin-storybook
```

Versions to follow the reference project (`epam/ai-dial-ui-kit`) which uses Storybook v10.

---

## What is NOT in scope for Phase 1

- Stories for any component other than `InlineAlert`
- Real `brand2.css` values
- SCSS style alternatives (Phase 3)
- Chromatic / CI integration
- Any changes to `apps/portals-example/`

---

## Future phases

| Phase | What changes |
|---|---|
| Phase 2 | Fill in `brand2.css` with real client 2 CSS variable values |
| Phase 3 | Add alternative SCSS files per brand (different typography, component styles) |
| Ongoing | Add `.stories.tsx` files for other components in `libs/ui-components` and other libs |
