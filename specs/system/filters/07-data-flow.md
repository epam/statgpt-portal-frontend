# Data Flow

The other specs in this series cover individual components — domain model, filter
construction, merging, constraints, persistence, grid. This spec covers the
**temporal dimension**: in what order things happen, what must complete before what,
and which parts of the system are state vs. refs vs. cached. It is the map for the
whole system.

Three sequences are described: initial load, filter change, and conversation reload.

---

## Sequence 1 — Cold Open: Conversation → Filter UI Ready

This sequence covers what happens between opening a conversation and the filter
modal being interactive with correct available values and restored selections.

### Phase 0 — Structural metadata (synchronous server data)

Before the React tree mounts, the Next.js Server Component in
`[locale]/layout.tsx` fetches deployment config and SDMX metadata
(`DatasetDimensionsMetadataMap`). This data is injected into context providers and
is available synchronously to all client components. No async fetch needed for it.

### Phase 1 — Parse the stored filter state

`Message.tsx` reads the system message from the conversation history, calls
`getDataQueries()` on its attachments, and produces `DataQuery[]`. These are passed
down as `attachmentsDataQuery` (single-dataset) or `attachmentsDataQueries`
(multi-dataset). For the data structures involved see `01-domain-model.md`; for how
the system message is located see `05-system-message-persistence.md`.

At this point the app knows **what was selected**, but not yet the full filter
structure (dimension labels, codelist, hierarchy).

### Phase 2 — Structure and constraint loading

**Single-dataset** (`Filters.tsx`): a `useEffect` triggers on
`dimensions / structures / structureDimensions`. It calls `getDatasetFilters()`
to build the skeleton `Filter[]` with no values selected, then immediately
starts `handleFiltersWithConstraints()` which fires `getConstraints()` and awaits
the response. Until the response arrives the filter UI shows a loading state.

**Multi-dataset** (`AttachmentsDataMultipleQueries` context): three async steps
run in sequence:

```
loadDimensionsSchemes(dataQueries)              // Phase 2a — lightweight, fast
  ↓
loadConstraintsMap(dataQueries)                 // Phase 2b — parallel, one request per dataset
  ↓
loadStructureData(dataQueries, constraintsMap)  // Phase 2c — two-wave load (see below)
```

Phase 2c runs two `Promise.allSettled` rounds inside `getStructureDataMaps`:

1. **Wave 1** — load dataset details (codelist + structural metadata) for all datasets
2. **Callback** — once wave 1 results are available, the caller checks for implicit
   shared wildcards via `getImplicitSharedWildcardFilterParams()`. If any dataset is
   missing a shared-dimension filter that another dataset has, the callback returns
   expanded filter params and sets `activeDatasetUrns`. See
   `03-shared-filters-merging.md` (Expanding Implicit Wildcards).
3. **Wave 2** — if the callback returned filter params, load data again with those
   params. Otherwise, load data without extra constraints.

Individual dataset failures are caught by `Promise.allSettled` and do not block
the other datasets. The resulting `structureDataMaps` is set into context
incrementally — it is partial until both waves complete.

`isStructureDataMapsReady()` (`multiple-filters.ts`) checks that all four required
maps (`dimensionsMap`, `structuresMap`, `structureDimensionsMap`, `constraintsMap`)
are present before the filter UI proceeds.

### Phase 3 — Fill values and preselect

Once structure data is ready, `getFilledDatasetFiltersMap()` replaces skeleton
`Filter[]` values with constraint-filtered localised `FilterValue[]` (see
`02-single-dataset-filters.md` section 1). Then `getFiltersPreselectedByDataQuery()`
(or the multi-dataset variant) applies the saved `QueryFilter[]` to mark the correct
values as selected (see `02-single-dataset-filters.md` section 2).

**One-time gate**: both `Filters.tsx` and `MultiDatasetFilters.tsx` guard
preselection with a `useRef(false)` flag (`isPreselectedFromDataQuery`). Preselection
runs exactly once — the first time structure data is ready. If dimensions or
structures change afterwards (dataset swap), the flag prevents preselection from
overwriting any edits the user has already made in the modal.

At this point the filter UI is ready: values are populated, prior selections are
restored, and the modal can be opened.

### Display filtering — `filterSharedValuesForEnabledDatasets`

Once the filter modal is open, `FilterSettings` continuously derives `displayFilters`
via `useMemo` from `filtersList`, `disabledDatasetUrns`, and `initialConstraintsMap`.
This derivation runs on every change to any of those three values (e.g. when the user
toggles a dataset on/off in the modal).

`displayFilters` is a display-only copy that hides SharedFilter values whose source
datasets are all disabled, hides the entire facet when no values remain, and clips the
Time Period range to the union of enabled datasets' available bounds. `FiltersFacetsList`
(left panel) and `FiltersValuesPanel` (right panel) consume `displayFilters`. The
`filtersList` state is never mutated by this derivation — it remains the source of
truth for Apply. See `03-shared-filters-merging.md` (Display-Safe Filtering) for the
full algorithm.

---

## Sequence 2 — User Changes a Filter → Persisted

This sequence covers what happens between the user clicking "Apply" in the filter
modal and the new state being saved to the backend.

### Step 1 — Serialise selections to QueryFilter[]

`onApply()` in `Filters.tsx` calls `getQueryFilters()` which internally calls
`buildQueryFiltersCore()` → `setDataQueryFilters()`. Each selected dimension becomes
a `QueryFilter` with `operator: 'in'` and the selected code IDs. Time period becomes
`operator: 'between'` with `MM-DD-YYYY` formatted dates. See
`02-single-dataset-filters.md` section 4.

For multi-dataset, `onApply()` in `MultiDatasetFilters.tsx` first calls
`buildFiltersMap()` to expand shared filters back to per-dataset native IDs, then
`getCompatibleDatasetUrns()` to exclude datasets whose filter selections are
incompatible. Incompatible datasets' filters are marked `isExcluded: true`.

`buildFiltersMap` accepts `disabledDatasetUrns` and removes those entries from the
result map after expansion. This means disabled datasets are absent from
`filtersParamsMap`, so their `DataQuery.filters` are not overwritten — the `...q`
spread in `updatedDataQueries` preserves the original saved selections.

After compatibility filtering, `onApply()` merges `disabledDatasetUrns` — the
in-modal working `Set<string>` tracking which datasets the user has toggled off —
into `updatedDataQueries`. Each `DataQuery` whose `urn` is in the set has
`disabled: true` written onto it; all others have the field absent. This merge
happens before both `onMultipleDataFiltersChange` and `addSystemMessage` are called.
`addSystemMessage` computes `updatedDataQueries` internally by closing over the
current value of `disabledDatasetUrns` at call time.

### Step 2 — Build and persist the system message

`onFiltersChange` / `onMultipleDataFiltersChange` is called with the serialised
filters. Inside the callback, `updateMessagesWithSystemMessage()` rebuilds the tail
of the message list:

- If the last message is already a `Role.System` message, it is replaced
- Otherwise the new system message is appended

The resulting `messages` array is passed to `updateConversation()`, which fires a
`PUT` API call. See `05-system-message-persistence.md` for the storage format
and invariants.

### Step 3 — Trigger data refresh

After persistence, the filter components call the data-loading action for each
active dataset with the updated `QueryFilter[]`. This fires new SDMX data API calls
and ultimately re-renders the grid or chart attachments.

Constraint re-fetching follows the same rules described in `04-constraints-fetching.md`:
shared filters are excluded from multi-dataset constraint requests; `TIME_PERIOD` is
always excluded.

---

## Sequence 3 — Conversation Reload → Filters Restored

This sequence covers what happens when a conversation is reopened (page refresh or
shared link) and previously saved filter state must be reconstructed.

### Step 1 — Locate the system message

`replace-python-attachment.ts` and the message rendering loop both do a **backward
scan** of the message array to find the most recent `Role.System` message. Earlier
system messages (mid-array from old filter changes) are ignored for driving the
active filter UI. See `05-system-message-persistence.md` (Invariants) for why
multiple system messages can exist.

### Step 2 — Parse DataQuery from attachments

`parseMessageAttachments(message)` → `getDataQueries(attachments)` →
`getDataQueryFromJson()`. The JSON parser handles the backward-compatibility field
renames (`component_code` → `componentCode`, etc.) documented in
`05-system-message-persistence.md` (Read Path, Step 2).

The resulting `DataQuery[]` is the sole source of prior filter selections. Nothing
else survives a page reload: constraint responses, hierarchy expansion state, and
which filter panel was open are all lost.

### Step 3 — Reload structure and constraints

Sequences exactly as Phase 2 of Sequence 1. The `DataQuery[]` drives the initial
constraint request in `getDataConstraintsMap()` (`attachments-data.ts`): each
dataset's existing `QueryFilter[]` is converted to `SeriesFilterDto[]` and sent as
the request input. This means the first constraint response reflects the user's saved
selections, not an empty selection.

### Step 4 — Apply preselection

`getFiltersPreselectedByDataQuery()` matches each saved `QueryFilter` to its
`Filter` by `componentCode === filter.id`. Time ranges are intersected with the
constraints-derived available range; the tighter of the two wins. Regular dimensions
mark matching code IDs as `isSelectedValue: true`.

For multi-dataset: `getFiltersPreselectedByDataQueries()` additionally handles the
implicit wildcard case — if Dataset A saved an explicit COUNTRY filter and Dataset B
saved none, Dataset B's filter values are all marked selected so the shared picker
shows a consistent state. See `02-single-dataset-filters.md` section 2 (Multi-dataset
variant).

The `isPreselectedFromDataQuery` ref gate fires the same way as during cold open:
exactly once.

---

## State vs. Ref vs. Cache

| Data | Storage | Lifetime |
|---|---|---|
| `DataQuery[]` (saved selections) | Conversation message (backend) | Survives reload |
| `Filter[]` (UI model) | React state | Component lifetime |
| `constraintsRef` | `useRef` | Component lifetime; updated async |
| `isPreselectedFromDataQuery` | `useRef` | Component lifetime; write-once |
| `structureDataMaps` | React context | Component lifetime |
| Request cache (`resolvedRequests`) | Module-level `Map` | Page session (never evicted) |
| `DatasetDimensionsMetadataMap` | React context (server-injected) | Page session |

The module-level request cache means that changing a filter, navigating away, and
returning to the same conversation will serve constraint responses from cache —
the SDMX server is not re-queried even if the underlying data changed.

---

## Timing Summary

```
Server Component renders
  → DatasetDimensionsMetadataMap injected (synchronous)

Conversation message list parsed
  → DataQuery[] extracted from latest Role.System message (synchronous)

React tree mounts
  → Phase 2a: dimension schemes loaded
  → Phase 2b: initial constraints loaded (parallel, one per dataset)
  → Phase 2c wave 1: structure data loaded (parallel)
  → Phase 2c callback: implicit wildcard check (synchronous calculation)
  → Phase 2c wave 2: data loaded with expanded filters (if wildcard detected)
  → Phase 3: fill values + preselect (synchronous once data is ready)

Filter UI interactive
```

Between Phase 2b and Phase 3 the filter panel shows a loading state. The rest of
the conversation (messages, other attachments) renders immediately; the filter panel
is the only part gated on async data.
