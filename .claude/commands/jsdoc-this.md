---
description: Generate or update JSDoc comments for a component, hook, or utility file (or folder), following the InlineAlert style.
argument-hint: <file-or-folder-path>
allowed-tools: [Read, Edit, Grep, Glob, Agent]
---

# jsdoc-this

Generate or update JSDoc for: `$ARGUMENTS`

## Step 1 — Determine scope

Parse `$ARGUMENTS` to decide if it's a single file or a folder.

- **File**: if the path matches `*.spec.*` or `*.test.*`, print "Skipping test file — JSDoc not needed in spec files" and stop. Otherwise follow the single-file flow (Steps 2–6).
- **Folder**: list all `.ts` / `.tsx` source files inside it (recursively), skip `index.ts` barrel files (files that only re-export), any `*.spec.*` / `*.test.*` files, and anything inside `__tests__/`, then follow the folder flow (Step 7).

## Step 2 — Read the style reference

Before writing anything, read `libs/ui-components/src/components/InlineAlert/InlineAlert.tsx` to internalize the exact JSDoc style (summary voice, detail paragraph tone, `@example` title format, `@param` phrasing). Match it precisely.

## Step 3 — Read the source file and classify

Read the source file, then classify its exported symbols:

| Type | Signals |
|---|---|
| React component | `.tsx`, function returns JSX |
| React hook | Function name starts with `use` |
| Pure utility | `.ts`, no React imports |

**Always skip:** type/interface/enum declarations, non-exported functions, barrel files with no logic.

## Step 4 — Check what needs to be written

### Component (single exported component per file)

Check for an existing JSDoc comment directly above the `export`:

- **Exists**: extract all `@param` tag names and compare against the current props interface. If all props are covered → print "JSDoc is up to date" and stop. If any props are missing → add only the missing `@param` lines; do not rewrite the whole comment.
- **Missing**: write a full JSDoc from scratch.

**Structure:**
```
/**
 * <One sentence: what it renders + its key capability.>
 *
 * <One paragraph: non-obvious defaults, customization points, context behavior.>
 * Omit entirely if the component is straightforward.
 *
 * @example
 * <Short title — minimal usage, no providers>
 * ```tsx
 * <3–8 line minimal example>
 * ```
 *
 * @example   ← add ONLY when a meaningfully different usage pattern exists
 * <Short title — e.g. with Provider, or key optional prop>
 * ```tsx
 * <3–8 line example>
 * ```
 *
 * @param propName - Intent in one line. Do not repeat the TypeScript type.
 */
```

Rules:
- Default to **1 example**. Add a second only for a clearly different pattern (Provider, conditional feature, etc.).
- `@param`: one line per prop.

### Hook (single exported hook per file)

Check for existing JSDoc:
- **Exists with a non-empty summary** → print "JSDoc is up to date" and stop.
- **Missing or empty** → write a one-line summary only. No `@param`, no `@example`.

**Structure:**
```
/**
 * <One sentence: what state or behavior the hook encapsulates and what it returns.>
 */
```

Always use the multiline format above — never collapse to `/** summary */` on a single line, even for short summaries.

### Utility file (all exported functions)

For each exported function (skip types/interfaces/enums, skip non-exports):

- **JSDoc exists**: compare `@param` tag names against the function signature. Add only missing `@param` tags; do not rewrite.
- **No JSDoc**: write a summary + `@param` tags.

**Structure per function:**
```
/**
 * <One sentence: what the function does.>
 *
 * @param name - One-line description.
 */
```

No `@example`. Add `@returns` only when the return value is genuinely non-obvious from the name and TypeScript type.

## Step 5 — Edit the file

Use the Edit tool to place each JSDoc comment directly above the `export` keyword of the function. Do not modify anything else in the file.

---

## Step 6 — Single-file done

After editing, print a one-line summary: how many functions were annotated, how many were skipped as up to date.

---

## Step 7 — Folder flow: parallel subagents

For each source file that needs processing, spawn one subagent **in parallel** using the Agent tool. Do not write JSDoc inline when handling a folder — always delegate to subagents.

Pass the following prompt to each subagent, substituting the actual `SOURCE_FILE` path:

---

```
Generate or update JSDoc comments for one source file.

## 1. Read the style reference
Read: libs/ui-components/src/components/InlineAlert/InlineAlert.tsx
Internalize the JSDoc style — summary voice, detail paragraph tone, @example title format, @param phrasing. Match it precisely.

## 2. Read the source file
Path: <SOURCE_FILE>

## 3. Classify exports
| Type | Signals |
|---|---|
| React component | .tsx, function returns JSX |
| React hook | Function name starts with `use` |
| Pure utility | .ts, no React imports |

Skip: type/interface/enum declarations, non-exported functions, barrel files.

## 4. Check and write per type

### Component
Check JSDoc above the export. If all props are documented → print "up to date" and stop.
If props are missing → add only missing @param lines.
If no JSDoc → write from scratch:
/**
 * <One sentence: what it renders + its key capability.>
 *
 * <One paragraph: non-obvious defaults/customization. Omit if straightforward.>
 *
 * @example
 * <Short title>
 * ```tsx
 * <3–8 line minimal example>
 * ```
 *
 * @param propName - Intent in one line. Do not repeat the TypeScript type.
 */
Default to 1 example. Add a second only for a clearly different usage pattern.

### Hook
Check for existing JSDoc with a non-empty summary → print "up to date" and stop.
Otherwise write only:
/**
 * <One sentence: what state/behavior the hook encapsulates and what it returns.>
 */
No @param, no @example. Always use the multiline format — never collapse to /** summary */ on a single line.

### Utility file
For each exported function (skip types, skip non-exports):
- JSDoc exists → add only missing @param tags.
- No JSDoc → write summary + @param tags:
/**
 * <One sentence: what the function does.>
 *
 * @param name - One-line description.
 */
No @example. Add @returns only if the return value is non-obvious.

## 5. Edit the file
Use the Edit tool. Place JSDoc directly above each export keyword. Do not change anything else.

## 6. Print a one-line summary
How many functions annotated, how many skipped as up to date.
```

---
