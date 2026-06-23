# Gotchas

This document is for developers who have already read specs 01–10 and are about to
touch the filter system. Everything here is either absent from the other specs or
only briefly mentioned. If a behavior is fully explained elsewhere, it is not
repeated here.

---

## Preselection runs exactly once — even if structural data changes

**Single-dataset only.** The single strategy guards the initial preselection step
with a `useRef(false)` flag, exposed to the shared init skeleton through the
`FilterInitStrategy` contract:

```ts
// use-single-filter-strategy.ts
const isPreselectedFromDataQuery = useRef(false);

const prepareInit = useCallback((): FilterInitResult => {
  if (isPreselectedFromDataQuery.current || !structures) return { status: 'skip' };
  // ... build filters via getSingleDatasetFiltersPreselectedByDataQuery
  return { status: 'ready', filters };
}, [/* dimensions, structures, structureDimensions, attachmentsDataQuery, ... */]);

const markInitialized = useCallback(() => {
  isPreselectedFromDataQuery.current = true;
}, []);
```

The shared `useFilterInitialization` (`use-filter-initialization.ts`) calls
`prepareInit`; on a `ready` result it dispatches the constraints request and then
calls `markInitialized`. The flag prevents structural data changes — dimensions
reloading, a dataset swap — from overwriting user edits in the modal. The
consequence is that if datasets are swapped after the first render, the old
preselection stays. This is intentional; the gate is load-bearing.

If you add a new trigger that should re-run preselection, you must reset the ref
explicitly. Removing the guard entirely causes user edits to be discarded on every
re-render that touches `prepareInit`'s dependency list.

**Multi-dataset has no such ref.** Its `prepareInit` (`use-multi-filter-strategy.ts`)
returns `pending` until `isStructureDataReady`, then `ready` whenever its inputs
change — so the shared init skeleton re-derives preselection on later input changes.
Disabled-dataset suppression (see `07-data-flow.md`, Phase 3) is what keeps this
re-derivation from leaking a disabled dataset's saved selections into the merged
picker.

---

## Two date formats for the same time range

`QueryFilter` time ranges use `MM-DD-YYYY`:

```ts
{ operator: 'between', values: ['01-01-2020', '12-31-2023'] }
```

`buildQueryFiltersForPythonAttachment()` uses ISO `YYYY-MM-DD`:

```ts
{ operator: 'between', values: ['2020-01-01', '2023-12-31'] }
```

Both serialize the same `timeRange`. The difference is consumer: the SDMX data API
expects `MM-DD-YYYY`; the Python code execution environment expects ISO. If you add
a third consumer, check which format it expects before reusing either function.
`buildDataQueryWithMergedFilters()` calls the Python variant — it is not generic.

---

## `expandSharedFilter` has a vestigial parameter

`expandSharedFilter` in `multiple-filters.ts` accepts a second parameter
`_propagateSharedFiltersToAllDatasets` (default `false`). It is prefixed with `_`
and is never read inside the function body. It does nothing. Do not write code that
passes `true` expecting different behavior — there is none.

---

## Modal close restores constraints to open-time snapshot, not live state

The mode strategy snapshots the constraints ref while the modal is open
(`remember`) and restores the ref to that snapshot when the modal closes without
applying (`restore`); the shared `useFilters` wires `restore` into `onCloseModal`.
Single-dataset snapshots `constraintsRef` (a flat `DataConstraints[]`);
multi-dataset snapshots `constraintsMapRef` (the per-dataset map):

```ts
// use-single-filter-strategy.ts (multi mirrors this with constraintsMapRef)
const remember = useCallback(() => {
  setInitialModalConstraints(constraintsRef.current);
}, []);
const restore = useCallback(() => {
  constraintsRef.current = initialModalConstraints; // restored to open-time value
}, [initialModalConstraints]);

// use-filters.ts
const onCloseModal = useCallback(() => {
  restore();
  closeModal();
}, [closeModal, restore]);
```

This means: if the user opens the modal, changes a filter (triggering a new
constraint fetch), then closes without applying — the next time they open the modal
they see the constraints from the previous open, not the latest fetch. Constraint
state does not persist across modal sessions unless the user clicks Apply.

---

## Constraint requests are not cancelled on rapid filter changes

`handleFiltersWithConstraints()` fires an async constraint request on every filter
change. There is no request cancellation or debounce. If the user makes three quick
selections, three requests are in flight simultaneously. The constraint ref is
written by whichever resolves last — not necessarily the one matching the current
selection. This is partially mitigated by the request cache: if selections revert to
a previously requested combination, the cached result is returned instantly and no
race is possible.

---

## `structureDataMaps` is partial until both load waves complete

`getStructureDataMaps` runs two `Promise.allSettled` rounds (wave 1: dataset
structures; wave 2: data). The maps object is updated after each wave. Components
that read from `structureDataMaps` before wave 2 completes will see populated
`dimensionsMap` and `structuresMap` but possibly empty or absent `dataMessagesMap`.

`isStructureDataMapsReady()` checks for the presence of all four required maps
(`dimensionsMap`, `structuresMap`, `structureDimensionsMap`, `constraintsMap`). The
filter UI is gated on this check. However, code that reads `dataMessagesMap` (e.g.
to build the cross-dataset grid) must separately check that the data messages for
the relevant dataset are present, since they arrive in wave 2.

---

## Incompatible datasets are marked, not removed

When the multi strategy's `runApply` (`use-multi-filter-strategy.ts`) finds that some
datasets are incompatible with the current shared filter selections, it does not remove those
datasets from the filters map. Instead, it marks their dimension-level filters as
`isExcluded: true`:

```ts
if (!filter.dimensionValues?.some((v) => v.isSelectedValue)) {
  return { ...filter, isExcluded: true };
}
```

The `isExcluded` flag is then serialized as `operator: 'excluded'` in the
`QueryFilter`. Grid and chart components must check this flag and treat excluded
datasets as inactive. The dataset URN remains in the `dataQueries` list; only the
per-dimension filter signals exclusion. See `01-domain-model.md` for the
`QueryFilterType.excluded` operator.

### Compatibility must be checked against the disabled-aware filters, not `modalFilters`

`runApply` computes `compatibleUrns` via `getCompatibleDatasetUrns`. It must pass
`appliedFilters` — the merged set rebuilt by `getFiltersByConstraints` *after*
`buildFiltersMap` has dropped disabled datasets — **not** the raw `modalFilters`.

`onToggleDataset` only mutates `disabledDatasetUrns`; it does not re-derive
`modalFilters`. So `modalFilters` can still carry a shared-filter selection whose
only `sourceValues` come from a now-disabled dataset (e.g. frequency `A` selected
while the only dataset that has `A` is disabled). Feeding that stale selection to
`getCompatibleDatasetUrns` makes every *enabled* dataset that lacks `A` look
incompatible, so they are dropped from the queries handed to
`onMultipleDataFiltersChange` and the grid renders empty. `appliedFilters` already
excludes the disabled dataset's contribution, so the selection is gone and the
remaining datasets are correctly judged compatible. (Symptom before the fix: empty
grid on first Apply, correct grid after reopening and pressing Apply again — because
the reopened modal is seeded from the rebuilt `appliedFilters`.)

---

## Hierarchy state is keyed by filter identity, not by dataset + dimension

The hierarchy state map (`hierarchyStateMap`) uses `getFilterIdentity(filter)` as
its key:

- `SharedFilter` → `"shared:COUNTRY"`, `"shared:FREQUENCY"`, etc.
- `DatasetFilter` → `"${datasetUrn}:${filterId}"`

For shared filters, both datasets contribute to the same hierarchy state entry. If
Dataset A's `REF_AREA` hierarchy differs from Dataset B's `GEO` hierarchy, only one
hierarchy tree is stored for the shared COUNTRY filter. The hierarchy loaded last
(whichever dataset's lazy-load completes last) wins. This is intentional — the
merged picker shows a unified tree — but it means you cannot retrieve per-dataset
hierarchy state for a shared dimension.

---

## `flushToGrid` alone does not render the grid

`flushToGrid` in `AttachmentsDataMultipleQueries.tsx` writes data into
`structureDataMaps` state, but the effect that actually builds the grid attachment
is gated on `!isLoadingGridData` (the condition at the top of the large `useEffect`
in the same file). If `isLoadingGridData` is still `true` when `flushToGrid` runs,
the state update lands silently and nothing visible changes.

Any early-flush call — such as the `DATASET_FETCH_DEADLINE_MS` deadline — must also
call `setIsLoadingGridData(false)` in the same batch, otherwise the flush is a
no-op from the user's perspective. The deadline only clears loading when there are
completed results to show (`completedResults.size > 0`); if nothing has arrived yet
the spinner is intentionally preserved. This will need revisiting when a partial
loading indicator is introduced, since that feature requires showing a
partially-built grid while loading is still technically in progress.

---

## The request cache survives filter changes but not page reloads

The module-level `resolvedRequests` map in `request-cache.ts` is never cleared
during a session. Once a constraint response is cached for a given (urn, filters)
combination, it is served from cache for the rest of the page session even if the
underlying data changed on the SDMX server.

The practical effect: if a user opens a conversation, sets filters, then changes
filters back to a previous combination, the constraint response from the first visit
is returned instantly from cache. A browser refresh is the only way to force fresh
constraint data.
