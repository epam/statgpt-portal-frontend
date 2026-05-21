# Spec conventions

## When specs must be updated

Any edit to a file listed in `specs/filters/README.md` under **Key Source Files**
must be accompanied by a corresponding update to the relevant spec in the same
change. Spec drift is a defect — treat it the same as a failing test.

The relevant spec for a given file is identified by:
1. The "Key files" section at the top of each spec, or
2. The spec table in `specs/filters/README.md`

## Scope

`specs/filters/` covers the full lifecycle of filters, dataset merging, constraints,
persistence, grids, Python attachment, applied-filters display, and chart attachments.
Read `specs/filters/README.md` for the full index and file-to-spec mapping.

## What counts as a spec-impacting change

- Adding, removing, or renaming a function described in a spec
- Changing the shape of a data type described in a spec
- Changing the order or gating of async steps described in a data-flow spec
- Adding a new invariant or gotcha
- Removing a gotcha that was fixed

Minor internal refactors with no externally visible behaviour change do not require
a spec update — but when in doubt, update.

## Line numbers

Line numbers in specs are approximate starting points. Use function and symbol names
for navigation. Update line numbers when you can; do not block a spec update because
you cannot verify every number.
