# Gotchas

This document is for developers who have already read specs 01–10 and are about to
touch the filter system. Everything here is either absent from the other specs or
only briefly mentioned. If a behavior is fully explained elsewhere, it is not
repeated here.

---

## Preselection runs exactly once — even if structural data changes

`Filters.tsx` and `MultiDatasetFilters.tsx` guard the initial preselection step
with a `useRef(false)` flag:

```ts
const isPreselectedFromDataQuery = useRef(false);

useEffect(() => {
  if (!isPreselectedFromDataQuery.current) {
    // ... call getFiltersPreselectedByDataQuery / getFiltersPreselectedByDataQueries
    isPreselectedFromDataQuery.current = true;
  }
}, [dimensions, structures, structureDimensions, attachmentsDataQuery, ...]);
```

The flag prevents structural data changes — dimensions reloading, a dataset swap —
from overwriting user edits in the modal. The consequence is that if datasets are
swapped after the first render, the old preselection stays. This is intentional; the
gate is load-bearing.

If you add a new trigger that should re-run preselection, you must reset the ref
explicitly. Removing the guard entirely causes user edits to be discarded on every
re-render that touches the dependency list.

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

When the filter modal opens, the current `constraintsRef.current` value is captured
into `initialModalConstraints` state. When the modal closes without applying, the
ref is restored to that snapshot:

```ts
const onCloseModal = useCallback(() => {
  constraintsRef.current = initialModalConstraints; // restored to open-time value
  setModalState(PopUpState.Closed);
}, [initialModalConstraints]);
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

When `onApply()` in `MultiDatasetFilters.tsx` finds that some datasets are
incompatible with the current shared filter selections, it does not remove those
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

## The request cache survives filter changes but not page reloads

The module-level `resolvedRequests` map in `request-cache.ts` is never cleared
during a session. Once a constraint response is cached for a given (urn, filters)
combination, it is served from cache for the rest of the page session even if the
underlying data changed on the SDMX server.

The practical effect: if a user opens a conversation, sets filters, then changes
filters back to a previous combination, the constraint response from the first visit
is returned instantly from cache. A browser refresh is the only way to force fresh
constraint data.
