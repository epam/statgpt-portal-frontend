---
description: Add a Storybook story for a ui-components component, detecting the correct patterns from the component source.
argument-hint: <ComponentName or path>
allowed-tools: [Read, Glob, Grep, Bash, Write, Edit]
---

# add-story

Add a Storybook story for: `$ARGUMENTS`

> Conventions (grouping, ID collision, fixed-positioning, portal pattern, JSDoc, brand SCSS) are in `.claude/rules/storybook-conventions.md`. Follow them for every story written here.

## Step 1 — Locate the component

Resolve `$ARGUMENTS` to the component directory:
- If it looks like a path, use it directly.
- If it's a component name (e.g. `Input`, `Dropdown`), find it under `libs/ui-components/src/components/`.

Read the main component `.tsx` file. If there is more than one `.tsx` file in the directory, read all of them.

## Step 2 — Check for an existing story

Check if a `{ComponentName}.stories.tsx` already exists in the same directory. If it does, ask the user whether to extend it or start fresh before continuing.

## Step 3 — Detect quirks

Scan the component source for these patterns and record what you find:

| Pattern | Signal | Required story technique |
|---|---|---|
| `position: fixed` or `position="fixed"` in styles/className | CSS fixed positioning | `transform: translateZ(0)` meta-level decorator |
| `FloatingPortal`, `createPortal`, `useFloating` | Portal rendering | Trigger-button wrapper with `useState` |
| `id` prop on `<input>`, `<Checkbox>`, `<Radio>` | Controlled input with label binding | Unique semantic ID per story + `useId()` for Interactive |
| Internal `useState` with no `value`/`checked`/`onChange` props | Self-managed state | No Interactive wrapper needed; component is already interactive |
| External `value`/`checked`/`onChange` props (controlled) | Controlled from outside | Interactive story with `useState` wrapper, goes first |

## Step 4 — Determine the story group

Use the group → components mapping from `.claude/rules/storybook-conventions.md` (the "Title and grouping" section). That file is the single source of truth — do not rely on a cached copy here.

If the component doesn't fit any listed group, choose the closest one and note the choice.

## Step 5 — Identify meaningful story variants

Read the component's props (and JSDoc if present) to identify:
- Required props that must always be provided
- Optional props that represent distinct visual states (e.g. `disabled`, `isLoading`, `size`, `variant`)
- Props that accept a limited set of values (candidates for `argTypes` select controls)

Plan stories to cover: default state, each major variant, disabled/error/loading states if they exist.

## Step 6 — Write the story file

Create `{ComponentName}.stories.tsx` next to the component. Apply:

1. **Title**: `'UI Components/{Group}/{ComponentName}'`
2. **Tags**: `['autodocs']`
3. **Quirk patterns** from Step 3
4. **Interactive story first** if the component is controlled (Step 3)
5. **Unique IDs** for each static story of controlled inputs
6. **argTypes select** for className props that accept multiple string values

Use this shell, filling in what Step 3–5 determined:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react'; // add useState, useId only if needed
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'UI Components/{Group}/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  // decorators: [...] if position:fixed
  // argTypes: {...} if select controls needed
  // args: {...} if shared defaults useful
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

// Interactive story FIRST if component is controlled
// Static variant stories after
```

## Step 7 — Check for brand SCSS need

After writing the story, look at the component's styles:
- If it uses only Tailwind utility classes, no brand SCSS is needed.
- If it uses component-specific CSS class names (non-Tailwind prefixes), check whether a brand SCSS file already exists in `apps/storybook/.storybook/brand-configs/`.
- If brand SCSS is missing: **do not generate or invent styles.** Brand SCSS must come from the portal app repos. If you don't have access to those repos, stop and ask the user to provide the SCSS content.

## Step 8 — Report

Summarize:
- The story file created
- Which quirk patterns were applied and why
- Whether brand SCSS was already present, or needs to be sourced from a client repo (and which one)
- Remaining components without stories (run: `find libs/ui-components/src/components -maxdepth 1 -mindepth 1 -type d | sort` and cross-check against `find libs/ui-components/src -name "*.stories.tsx"`)
