---
description: Write Jest tests for a file or folder, following repo conventions. Detects the Nx project automatically.
argument-hint: <file-or-folder-path>
allowed-tools: [Read, Glob, Grep, Bash, Write, Edit]
---

# test-this

Write Jest tests for: `$ARGUMENTS`

## Step 1 — Determine scope

Parse `$ARGUMENTS` to decide if it's a single file or a folder.

- **File**: write tests for that one file, then run them.
- **Folder**: list all `.ts` / `.tsx` source files inside it (recursively), skip any already-existing `*.spec.*` or `*.test.*` files and anything inside `__tests__/`, then write tests for each remaining file one at a time, running after each.

## Step 2 — Detect the Nx project

Extract the project name from the path:
- Pattern: `libs/<project-name>/...` or `apps/<project-name>/...`
- The second path segment IS the project name (e.g. `libs/conversation-view/src/...` → `conversation-view`, `apps/portals-example/src/...` → `portals-example`).
- Known projects: `portals-example`, `ui-components`, `conversation-view`, `conversation-list`, `dial-toolkit`, `sdmx-toolkit`, `shared-toolkit`, `download-panel`, `share-conversation`, `user-info`.

Run tests with:
```
npx nx test <project-name> --testFile=<spec-file-path>
```

## Step 3 — Check project test setup (once per project)

Before writing the first spec for a project, verify:

1. `tsconfig.spec.json` `include` array contains `*.spec.tsx` and `*.test.tsx` — add them if missing.
2. `jest.config.js` has `setupFilesAfterEnv: ['./test-setup.ts']` — add if missing.
3. `test-setup.ts` exists at the project root with `import '@testing-library/jest-dom';` — create if missing.

## Step 4 — Determine spec file location

Place specs in a `__tests__/` subfolder next to the source file:

```
src/.../helpers/utils.ts          → src/.../helpers/__tests__/utils.spec.ts
src/.../hooks/useMyHook.ts        → src/.../hooks/__tests__/useMyHook.spec.ts
src/.../components/MyComponent.tsx → src/.../components/__tests__/MyComponent.spec.tsx
```

Use `.spec.ts` for pure TypeScript files, `.spec.tsx` for files containing JSX or React components.

## Step 5 — Read the source file and classify it

Read the file, then classify:

| Type | Signals | Test approach |
|---|---|---|
| Pure utility functions | No imports from React, no hooks | Plain `describe/it/expect`, no mocks for internal code |
| GridApi-dependent | Imports `GridApi` from `ag-grid-community` | Mock as plain object: `{ method: jest.fn() } as unknown as GridApi` |
| React hook | Function name starts with `use` | `renderHook` from `@testing-library/react` |
| React component | Returns JSX, has props | `render` from `@testing-library/react`, assert with `screen` |
| React context | `createContext` / Provider pattern | Test hook throws outside provider; test state mutations via `act` |

## Step 6 — Mocking strategy

**AG Grid `GridApi`** — never import the real class. Use a plain object:
```ts
function mockApi(overrides = {}) {
  return {
    getColumnState: jest.fn().mockReturnValue([]),
    getColumnGroupState: jest.fn().mockReturnValue([]),
    applyColumnState: jest.fn(),
    setColumnGroupState: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getColumnDefs: jest.fn().mockReturnValue([]),
    refreshCells: jest.fn(),
    ...overrides,
  } as unknown as GridApi;
}
```

**External `@epam/statgpt-*` packages** — mock at the module level when the function under test calls them internally:
```ts
jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getDimensions: jest.fn(),
  getDimensionTitle: jest.fn(),
  getLocalizedName: jest.fn(),
}));
```
Use real implementations for pure type imports and when testing utility functions directly.

**Internal project utilities** — always use real implementations, never mock them.

**React Context dependencies** — wrap with the real Provider, or mock the context hook if testing a component in isolation.

## Step 7 — Test case guidelines

- Cover the happy path first, then edge cases (empty input, null/undefined, boundary values).
- For pure functions: test each exported function independently.
- For hooks: test each returned handler/value independently using `rerender` and `unmount` from `renderHook`.
- For components: test rendering, user interactions (fireEvent / userEvent), and conditional rendering.
- When a test fails due to a wrong expectation (not a bug), fix the expectation and document the actual behaviour in the test description.
- Keep each `it` block focused on one behaviour.

## Step 8 — Run and fix

After writing the spec, run:
```
npx nx test <project-name> --testFile=<spec-file-path>
```

If tests fail:
- Read the error carefully.
- If the expectation is wrong (misunderstood the implementation), fix the test.
- If there's a genuine bug or unexpected behaviour, flag it to the user rather than silently adjusting the test.
- Do not retry the same failing test without changing something.
