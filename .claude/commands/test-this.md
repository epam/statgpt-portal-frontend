---
description: Write Jest tests for a file or folder, following repo conventions. Detects the Nx project automatically.
argument-hint: <file-or-folder-path>
allowed-tools: [Read, Glob, Grep, Bash, Write, Edit, Agent]
---

# test-this

Write Jest tests for: `$ARGUMENTS`

> Conventions (file location, classification, style references, mocking rules, test guidelines, run command) are defined in `.claude/rules/test-conventions.md`. Follow them for every spec written here.

## Step 1 — Determine scope

Parse `$ARGUMENTS` to decide if it's a single file or a folder.

- **File**: follow the single-file flow (Steps 2–4).
- **Folder**: list all `.ts` / `.tsx` source files inside it (recursively), skip any already-existing `*.spec.*` or `*.test.*` files and anything inside `__tests__/`, then follow the folder flow (Step 5).

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

## Step 4 — Write the spec

Read the source file, then follow `.claude/rules/test-conventions.md` to classify it, pick the spec location, apply the correct mocking strategy, write the tests, and run them.

---

## Step 5 — Folder flow: parallel subagents

For each source file that needs a spec, spawn one subagent **in parallel** using the Agent tool.

Pass the following prompt to each subagent, substituting the actual values for `SOURCE_FILE`, `PROJECT_NAME`, and `SPEC_FILE`:

---

```
Write a Jest spec for one source file. Follow the conventions in `.claude/rules/test-conventions.md` exactly.

## 1. Read the source file
Path: <SOURCE_FILE>

## 2. Check project test setup
Before writing, verify:
- `tsconfig.spec.json` includes `*.spec.tsx` and `*.test.tsx`
- `jest.config.js` has `setupFilesAfterEnv: ['./test-setup.ts']`
- `test-setup.ts` exists with `import '@testing-library/jest-dom';`

## 3. Write the spec
Nx project: <PROJECT_NAME>
Write the spec to: <SPEC_FILE>

## 4. Run and fix
npx nx test <PROJECT_NAME> --testFile=<SPEC_FILE>

If tests fail: read the error, fix the expectation or flag a bug. Do not retry without changing something.
```
