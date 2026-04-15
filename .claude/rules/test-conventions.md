---
description: Conventions that apply to every test creation or editing request in this repo.
globs: ["**/*.spec.ts", "**/*.spec.tsx", "**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"]
---

# Test conventions

## Spec file location

Place specs in a `__tests__/` subfolder next to the source file:

```
src/.../helpers/utils.ts           → src/.../helpers/__tests__/utils.spec.ts
src/.../hooks/useMyHook.ts         → src/.../hooks/__tests__/useMyHook.spec.ts
src/.../components/MyComponent.tsx → src/.../components/__tests__/MyComponent.spec.tsx
```

Use `.spec.ts` for pure TypeScript, `.spec.tsx` for files containing JSX or React.

## File classification and test approach

| Type | Signals | Approach |
|---|---|---|
| Pure utility | No React imports, no hooks | `describe/it/expect`, no mocks for internal code |
| GridApi-dependent | Imports `GridApi` from `ag-grid-community` | Mock as plain object (see Mocking rules) |
| React hook | Function name starts with `use` | `renderHook` from `@testing-library/react` |
| React component | Returns JSX, has props | `render` + `screen` from `@testing-library/react` |
| React context | `createContext` / Provider pattern | Test throws outside provider; `act()` for state mutations |

## Style references

Read the matching example **before writing any spec** and match its style exactly (describe/it naming, factory helpers, assertion patterns, import order):

| Type | Reference file |
|---|---|
| Pure utility | `libs/ui-components/src/components/DraggableList/utils/__tests__/utils.spec.ts` |
| React hook | `libs/ui-components/src/components/DraggableList/__tests__/DraggableListRow.spec.tsx` |
| React component / context | `libs/ui-components/src/components/InlineAlert/InlineAlert.spec.tsx` |

## Mocking rules

**AG Grid `GridApi`** — never import the real class; use a plain object factory:
```ts
function mockApi(overrides = {}) {
  return {
    getColumnState: jest.fn().mockReturnValue([]),
    applyColumnState: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    // add only the methods the file under test actually calls
    ...overrides,
  } as unknown as GridApi;
}
```

**External `@epam/statgpt-*` packages** — mock at module level when the function under test calls them internally:
```ts
jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getDimensions: jest.fn(),
}));
```

**Internal project utilities** — always use real implementations, never mock them.

**React context dependencies** — wrap with the real Provider, or mock the context hook when testing a component in isolation.

## Test case guidelines

- Happy path first, then edge cases (empty, `null`/`undefined`, boundary values).
- One behaviour per `it` block.
- For hooks: test each returned value/handler using `rerender` and `unmount` from `renderHook`.
- For components: cover rendering, user interactions (`fireEvent`/`userEvent`), and conditional rendering.
- Wrong expectation → fix the test and note actual behaviour in the description.
- Genuine bug found → flag it to the user, do not silently adjust the test.

## After writing, always run

```bash
npx nx test <project-name> --testFile=<spec-file-path>
```

Fix failures before reporting done. If an expectation is wrong, fix it. If it's a real bug, stop and flag it.
