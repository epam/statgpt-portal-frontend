---
description: Write Jest tests for a file or folder, following repo conventions. Detects the Nx project automatically.
argument-hint: <file-or-folder-path>
allowed-tools: [Read, Glob, Grep, Bash, Write, Edit, Agent]
---

# test-this

Write Jest tests for: `$ARGUMENTS`

## Step 1 — Determine scope

Parse `$ARGUMENTS` to decide if it's a single file or a folder.

- **File**: follow the single-file flow (Steps 2–7).
- **Folder**: list all `.ts` / `.tsx` source files inside it (recursively), skip any already-existing `*.spec.*` or `*.test.*` files and anything inside `__tests__/`, then follow the folder flow (Step 8).

## Step 2 — Detect the Nx project

Extract the project name from the path:
- Pattern: `libs/<project-name>/...` or `apps/<project-name>/...`
- The second path segment IS the project name (e.g. `libs/conversation-view/src/...` → `conversation-view`).
- Known projects: `portals-example`, `ui-components`, `conversation-view`, `conversation-list`, `dial-toolkit`, `sdmx-toolkit`, `shared-toolkit`, `download-panel`, `share-conversation`, `user-info`.

## Step 3 — Check project test setup (once per project)

Before writing any spec, verify:

1. `tsconfig.spec.json` `include` array contains `*.spec.tsx` and `*.test.tsx` — add them if missing.
2. `jest.config.js` has `setupFilesAfterEnv: ['./test-setup.ts']` — add if missing.
3. `test-setup.ts` exists at the project root with `import '@testing-library/jest-dom';` — create if missing.

## Step 4 — Read style reference

Read the appropriate example spec **before writing anything** and match its style exactly (describe/it naming, factory helpers, assertion patterns, import order):

| File type | Style reference to read |
|---|---|
| Pure utility (`.ts`, no React imports) | `libs/ui-components/src/components/DraggableList/utils/__tests__/utils.spec.ts` |
| React hook (function name starts with `use`) | `libs/ui-components/src/components/DraggableList/__tests__/DraggableListRow.spec.tsx` |
| React component / context (`.tsx`, returns JSX) | `libs/ui-components/src/components/InlineAlert/InlineAlert.spec.tsx` |

## Step 5 — Classify the source file

Read the source file, then classify:

| Type | Signals | Test approach |
|---|---|---|
| Pure utility functions | No imports from React, no hooks | Plain `describe/it/expect`, no mocks for internal code |
| GridApi-dependent | Imports `GridApi` from `ag-grid-community` | Mock as plain object: `{ method: jest.fn() } as unknown as GridApi` |
| React hook | Function name starts with `use` | `renderHook` from `@testing-library/react` |
| React component | Returns JSX, has props | `render` from `@testing-library/react`, assert with `screen` |
| React context | `createContext` / Provider pattern | Test hook throws outside provider; test state mutations via `act` |

## Step 6 — Spec file location

Place specs in a `__tests__/` subfolder next to the source file:

```
src/.../helpers/utils.ts           → src/.../helpers/__tests__/utils.spec.ts
src/.../hooks/useMyHook.ts         → src/.../hooks/__tests__/useMyHook.spec.ts
src/.../components/MyComponent.tsx → src/.../components/__tests__/MyComponent.spec.tsx
```

Use `.spec.ts` for pure TypeScript, `.spec.tsx` for files containing JSX or React components.

## Step 7 — Mocking strategy, test guidelines, run and fix

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

**Internal project utilities** — always use real implementations, never mock them.

**React Context dependencies** — wrap with the real Provider, or mock the context hook if testing a component in isolation.

**Test case guidelines:**
- Cover the happy path first, then edge cases (empty, null/undefined, boundary values).
- For pure functions: test each exported function independently.
- For hooks: test each returned handler/value using `rerender` and `unmount` from `renderHook`.
- For components: test rendering, user interactions (`fireEvent`/`userEvent`), and conditional rendering.
- When a test fails due to a wrong expectation (not a bug), fix the expectation and document the actual behaviour in the test description.
- Keep each `it` block focused on one behaviour.

**Run after writing:**
```
npx nx test <project-name> --testFile=<spec-file-path>
```

If tests fail:
- Read the error carefully.
- If the expectation is wrong (misunderstood the implementation), fix the test.
- If there's a genuine bug, flag it to the user — do not silently adjust the test.
- Do not retry the same failing test without changing something.

---

## Step 8 — Folder flow: parallel subagents

For each source file that needs a spec, spawn one subagent **in parallel** using the Agent tool. Do not write specs inline when handling a folder — always delegate to subagents.

Pass the following prompt to each subagent, substituting the actual values for `SOURCE_FILE`, `PROJECT_NAME`, and `SPEC_FILE`:

---

```
Write a Jest spec for one source file. Do the following in order:

## 1. Read the source file
Path: <SOURCE_FILE>

## 2. Classify it
| Type | Signals | Test approach |
|---|---|---|
| Pure utility | No React imports, no hooks | Plain describe/it/expect, real implementations |
| GridApi-dependent | Imports GridApi from ag-grid-community | Mock as plain object with jest.fn() methods |
| React hook | Function starts with `use` | renderHook from @testing-library/react |
| React component | Returns JSX | render + screen from @testing-library/react |
| React context | createContext / Provider | Test throws outside provider; act() for mutations |

## 3. Read the style reference for the classified type
- Pure utility → read: libs/ui-components/src/components/DraggableList/utils/__tests__/utils.spec.ts
- React hook → read: libs/ui-components/src/components/DraggableList/__tests__/DraggableListRow.spec.tsx
- React component / context → read: libs/ui-components/src/components/InlineAlert/InlineAlert.spec.tsx

Match this reference exactly: describe/it naming, factory helper functions, assertion style, import order.

## 4. Determine spec location
Place the spec in a __tests__/ subfolder next to the source file.
Use .spec.ts for pure TypeScript, .spec.tsx for JSX/React.

## 5. Mocking strategy
- AG Grid GridApi: plain object mock — { method: jest.fn() } as unknown as GridApi
- External @epam/statgpt-* packages: jest.mock() at module level when called internally
- Internal utilities: always use real implementations
- React contexts: wrap with real Provider, or mock context hook for isolation

## 6. Test case guidelines
- Happy path first, then edge cases (empty, null/undefined, boundary values)
- One behaviour per it block
- For pure functions: test each export independently
- For hooks: test each returned value/handler using renderHook
- For components: cover rendering, interactions (fireEvent/userEvent), conditional rendering
- Wrong expectation → fix the test and note actual behaviour in the description
- Genuine bug → flag it, do not silently adjust

## 7. Write the spec
Nx project: <PROJECT_NAME>
Write the spec to: <SPEC_FILE>

## 8. Run and fix
npx nx test <PROJECT_NAME> --testFile=<SPEC_FILE>

If tests fail: read the error, fix the expectation or flag a bug. Do not retry without changing something.
```

---
