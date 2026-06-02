---
description: Conventions that apply to every story creation or editing request in this repo.
globs: ["**/*.stories.ts", "**/*.stories.tsx"]
---

# Storybook story conventions

## Before writing a story

**Read the component source first.** Check for:

| Signal | Required technique |
|---|---|
| `position: fixed` in styles/className | `transform: translateZ(0)` meta-level decorator (see below) |
| `FloatingPortal`, `createPortal`, `useFloating` | Trigger-button wrapper pattern (see below) |
| `id` prop on `<input>`, `<Checkbox>`, `<Radio>` | Unique semantic ID per static story + `useId()` for Interactive |
| Internal `useState` with no `value`/`checked`/`onChange` props | No Interactive wrapper — component manages its own state |
| External `value`/`checked`/`onChange` props (controlled) | Interactive story with `useState` wrapper, placed **first** |

## Title and grouping

```
title: 'UI Components/{Group}/{ComponentName}'
```

| Group | Components |
|---|---|
| `Buttons` | Button, CloseButton, CopyButton, IconButton |
| `Form` | Checkbox, Radio, Input, Dropdown, Calendar |
| `Feedback` | Alert, InlineAlert |
| `Overlays` | Popup |
| `Display` | CollapsibleBlock, HighlightText, Link, Tag, Loader, DraggableList, RequestLimit, DownloadFormatMessage |

## Story order

**The first exported story becomes the primary story on the autodocs page.**

- If the component is interactive (has internal state or is a controlled input), put the `Interactive` story first.
- If it is purely presentational, put the most representative variant first (usually `Default` or `Primary`).

## Interactive stories — named component pattern

**Interactive stories intentionally bypass Storybook controls.** `render: () => <InteractiveFoo />` takes no args, so the controls panel and `meta.args` defaults have no effect on it. This is by design — the story demonstrates real interaction via internal state, not prop-driven snapshots. Do not wire `argTypes` on an Interactive story expecting the controls to work.

Always extract stateful render logic into a named component. Hooks linter requires either an uppercase function name (component) or `use` prefix (hook).

```tsx
// CORRECT
const InteractiveCheckbox = () => {
  const id = useId();
  const [checked, setChecked] = useState(false);
  return <Checkbox id={id} label="Label" checked={checked} onChange={(_, v) => setChecked(v ?? !checked)} />;
};
export const Interactive: Story = { render: () => <InteractiveCheckbox /> };

// WRONG — hooks linter error
export const Interactive: Story = { render: () => { const [v, setV] = useState(false); return ... } };
```

## ID collision — controlled inputs

When multiple stories render in the same docs page DOM, duplicate `id` attributes cause `htmlFor` label bindings to wire to the wrong input. Give each static story a unique semantic ID:

```tsx
export const Unchecked: Story  = { args: { id: 'unchecked',  checked: false } };
export const Checked: Story    = { args: { id: 'checked',    checked: true } };
export const Disabled: Story   = { args: { id: 'disabled',   checked: false, disabled: true } };
```

Use `useId()` from React for the Interactive story so its ID is guaranteed unique even in concurrent renders.

## `position: fixed` components — transform decorator

CSS `transform` creates a new containing block. `position: fixed` children anchor to the nearest transformed ancestor instead of the viewport — which is exactly what we want to keep the component inside its docs panel.

```tsx
import type { Decorator } from '@storybook/react-vite';

const meta: Meta<typeof Alert> = {
  decorators: [
    ((Story: Parameters<Decorator>[0]) => (
      <div style={{ transform: 'translateZ(0)', height: '120px', position: 'relative' }}>
        <Story />
      </div>
    )) as Decorator,
  ],
};
```

Adjust `height` to fit the component's natural height.

## Portal components — trigger-button wrapper pattern

`FloatingPortal` renders into the DOM outside the React tree, bypassing any ancestor `transform`. The transform trick does **not** work here. Instead, use a wrapper component with a trigger button:

```tsx
const PopupDemo = ({ heading, size }: { heading?: string; size?: PopUpSize }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="base-button text-button-primary px-4 py-2" onClick={() => setOpen(true)}>
        Open Popup
      </button>
      <Popup
        state={open ? PopUpState.Opened : PopUpState.Closed}
        onClose={() => setOpen(false)}
        heading={heading ?? 'Dialog Title'}
        ...
      />
    </>
  );
};

export const Default: Story = { render: () => <PopupDemo /> };
export const Large: Story   = { render: () => <PopupDemo size={PopUpSize.LG} /> };
```

**Controls are disconnected on portal stories** — `render: () => <PopupDemo />` takes no args, so the Storybook controls panel cannot reach the wrapper's props. This is a fundamental limitation of the portal approach, not an oversight. The workaround is to create one hardcoded story per meaningful variant (size, heading, dividers) rather than trying to wire controls.

## JSDoc / autodocs

`preview.tsx` strips `@example` blocks that contain a fenced code block (the regex requires at least one ` ``` ` pair). Bare `@example` text without a code fence will survive and render in autodocs. Do not:
- Add a `parameters.docs.description` to override this
- Copy JSDoc text into story `args`

## Brand-specific SCSS

**New components** should be styled with Tailwind CSS utility classes and props — no per-brand SCSS needed.

**Existing components** use custom CSS utility classes that must match the portal app repos exactly. Never generate or invent brand SCSS. Source it from the portal app repos; if those are not accessible, ask the user to provide the content.

`fonts.scss` is a one-time per-brand file (already exists). Do not recreate it when adding a new component.

When the user provides the content for an existing component:
1. Create `apps/storybook/.storybook/brand-configs/brand1/{component}.scss` (committed)
2. Add `@use "./{component}";` to `brand1/styles.scss`
3. Optionally mirror in `local-brand1/` if the local brand also needs it (gitignored, not committed)

Do not use `@tailwind` directives or `@layer` in these files.

## argTypes select controls

For `buttonClassName` and similar class-name props, use a `select` control so the docs panel shows a dropdown:

```tsx
argTypes: {
  buttonClassName: {
    control: { type: 'select' },
    options: ['text-button-primary', 'text-button-secondary', 'text-button-tertiary', 'text-button-client'],
  },
},
```

## Template

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'UI Components/{Group}/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    // required props only
  },
};
```
