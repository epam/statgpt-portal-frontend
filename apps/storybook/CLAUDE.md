# Storybook App

Storybook for `@epam/statgpt-ui-components`. Stories live in `libs/ui-components/src/` next to the components they document.

## Commands

```bash
npx nx storybook storybook    # Start dev server (port 6006)
npx nx build-storybook storybook  # Static build
```

## Story discovery

`main.ts` scans `libs/**/src/**/*.stories.@(ts|tsx)`. A story file placed anywhere in `libs/` is picked up automatically — no registration needed.

## Story authoring conventions

See `.claude/rules/storybook-conventions.md` for the full set of patterns (grouping, ID collision, fixed-positioning decorator, portal trigger-button pattern). Invoke `/add-story` for a guided workflow when adding a new component.

## Brand system

Every story is wrapped in the `withBrand` decorator (`preview.tsx`) which does three things:

1. **CSS theme** — injects `/brand-themes/{brand}.css` (sourced from `themes/brand1.css` / `themes/brand2.css`). Contains design tokens (colors, radius, etc.).
2. **Component styles** — injects the brand's compiled SCSS string (from `brand-configs/{brand}/styles.scss?inline`). This is the Tailwind + per-component SCSS processed through PostCSS.
3. **InlineAlertProvider** — provides brand-specific icon config to `<InlineAlert>`.

### Brand config structure

```
.storybook/brand-configs/
  brand1/
    styles.scss        ← entry: @use "./{component}.scss" for each styled component
    fonts.scss         ← one-time brand setup, already exists — do not recreate per component
    buttons.scss
    alert.scss
    input.scss
    loader.scss
    calendar.scss
    index.tsx          ← InlineAlertConfig (icons for InlineAlert variants)
  brand2/
    ...same shape, different values...
  assets/
    error.svg / warning.svg / info.svg   ← shared icons for InlineAlertProvider
```

### Adding brand styles for an existing component

Existing components use custom CSS utility classes whose styles must match the portal app repos exactly. **Never generate or invent brand SCSS.** The content must come from the portal app repos. If those repos are not accessible, ask the user to provide the SCSS.

Once the content is available:
1. Create `brand-configs/brand1/{component}.scss` and `brand-configs/brand2/{component}.scss`
2. Add `@use "./{component}";` to each brand's `styles.scss`

Do NOT add Tailwind directives (`@tailwind base/utilities`) or `@layer` in these files — they are processed as-is through PostCSS.

### New components

New components should be styled with **Tailwind CSS utility classes and props** rather than custom CSS utility classes. This avoids the need for per-brand SCSS files entirely and keeps styling self-contained in the component.

## What `preview.tsx` already handles

- `extractComponentDescription` strips `@example` blocks that contain a fenced code block (` ``` `). Bare `@example` text without a code fence is NOT stripped and will appear in autodocs. Do not duplicate JSDoc in story `parameters.docs`.
- `InlineAlertProvider` wraps all stories — `<InlineAlert>` works out of the box.
- `withBrand` decorator runs on every story — brand toolbar in the top bar switches between Brand 1 and Brand 2.