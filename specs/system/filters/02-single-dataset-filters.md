# Single-Dataset Filters

This spec covers the filter lifecycle for **one dataset in isolation**: how
`Filter[]` objects are constructed from SDMX structural data, how saved filter
state is restored when a conversation is reopened, how constraint responses update
the available values, and how the final selection is serialised back into
`QueryFilter[]` for persistence and API calls.

The multi-dataset merging layer sits on top of everything described here — it
calls these same utilities per dataset before combining results.

---

## 1. Building Filters from Structural Data

**Entry point:** `getDatasetFilters()` in
`libs/conversation-view/src/utils/filters.ts:27`

This function takes SDMX structural data and produces the initial `Filter[]` for a
dataset — one filter per dimension, with all available values populated.

```
Dimension[] + StructuralData + StructureItemBase[] + locale + datasetUrn
  → Filter[]
```

For each dimension it:
1. Finds the associated codelist (via `findCodelistByDimension`)
2. Calls `getAvailableCodes()` to produce `FilterValue[]` — codes filtered by
   what's structurally allowed and localised to the current locale
3. Sets `isHierarchical = true` if any code has a `parent` reference
4. Sets `displayMode` to `HIERARCHY` if hierarchical, `FLAT_LIST` otherwise
5. Sets `isTimeDimension = true` for dimensions of type `DimensionType.TIME_DIMENSION`

At this stage all values have `isSelectedValue = false` — nothing is selected yet.

### Filling values from constraints

After the first constraints response arrives, `getFilledFilters()`
(`libs/conversation-view/src/utils/get-filled-filters.ts:11`) replaces the
dimension values with constraint-filtered ones:

1. For each dimension, calls `getAvailableCodesFromConstrains()` — this returns
   only the codes the SDMX server said are available given the current filter state
2. Merges selection state: any value that was selected in the old filter and still
   appears in the constraint response keeps its `isSelectedValue = true`
3. **Preserves extra selected values** not in the constraint response — these are
   hierarchy-only codes that are valid in a hierarchy view but absent from the
   constraint cube region. Without this, selecting a parent code and then
   refreshing constraints would silently deselect it.

The `getFilledDatasetFiltersMap()` function in `multiple-filters.ts:640` is the
multi-dataset wrapper: it calls `getFiltersWithValuesMap()`, which calls
`getAvailableCodesFromConstrains()` directly for each dataset, and returns empty
`dimensionValues` when constraints or data messages are not yet available. Note:
the "preserve extra selected hierarchy codes" logic described above lives in
`getFilledFilters()`, which is called by `getFiltersByConstraints()` — the
interactive-update path — not by `getFilledDatasetFiltersMap()`.

---

## 2. Restoring Saved State (Preselection)

When a conversation is reopened, `DataQuery[]` is read from the system message
(see `05-system-message-persistence.md`). The saved `QueryFilter[]` inside each
`DataQuery` need to be applied to the freshly-built `Filter[]`.

**Entry point:** `getFiltersPreselectedByDataQuery()` in
`libs/conversation-view/src/utils/filters.ts:175`

For each filter in the `Filter[]` it looks for a matching `QueryFilter` by
`componentCode === filter.id`:

- **Time dimension:** Parses the `BETWEEN` values back to `Date` objects, then
  intersects with the constraints-derived time range from `getAnnotationPeriod()`.
  If both exist, the tighter of the two ranges wins — the saved range is clipped to
  what the constraint says is actually available.

- **Regular dimension:** Sets `isSelectedValue = true` on any `FilterValue` whose
  `id` is in `filterFromAttachment.values`.

- **No saved filter for this dimension:** Leaves the filter as-is (no selection).

### Multi-dataset variant

`getFiltersPreselectedByDataQueries()` in `multiple-filters.ts:673` wraps the
above for multiple datasets. It has one additional behaviour: **wildcard
propagation**. If Dataset A has an explicit COUNTRY selection and Dataset B has no
COUNTRY filter saved at all (implicit wildcard), and both datasets contribute to a
shared COUNTRY filter, then Dataset B's values are all selected so the shared
filter shows them as selected. Without this, the shared filter UI would show
Dataset A's countries as selected but Dataset B's as unselected, which is
misleading.

---

## 3. Responding to User Selection Changes

Two mutation utilities in `filters.ts` handle the common cases:

**`updateFiltersWithSelectedItem(filters, selectedFilter)`** — marks one filter as
the currently open/active one (`isSelectedFilter = true`), clears the flag on all
others. Used when the user opens a filter panel.

**`updateFiltersWithDisplayMode(filters, currentFilter, displayMode)`** — updates
the display mode (flat list, hierarchy, or a named hierarchy URN) for one filter.

**`getFiltersAfterDelete(filters, deletedFilter)`** and
**`getFiltersAfterClear(filters)`** — both call `clearFilterValues()` which sets
all `isSelectedValue = false` and clears `timeRange`. "Delete" clears one specific
filter; "Clear all" clears every filter.

**Hierarchical selection:** When a user selects a node in a hierarchical filter,
`getFilterNodesBySelection()` in `filters.ts:316` cascades the selection state to
all descendants. Selecting a parent selects all children; deselecting a parent
deselects all children.

---

## 4. Serialising Filters to QueryFilter[]

When the user confirms their selection, the UI layer calls `setDataQueryFilters()`
(or `buildDataQueryWithMergedFilters()` for the full DataQuery merge).

**`setDataQueryFilters(filters, datasetUrn)`** in `query-filters.ts:186`

This is the core serialisation step. It calls `buildQueryFiltersCore()` which:

1. Calls `getFiltersForQueryContext(filters, datasetUrn)` to get only the filters
   relevant to this dataset (handles shared filter expansion — see spec 03)
2. Keeps only filters that have something to say: a time range, an excluded flag,
   or at least one selected value
3. For each kept filter:
   - **Time dimension:** produces `{ operator: 'between', values: [start, end] }`
     formatted as `MM-DD-YYYY`
   - **Excluded:** produces `{ operator: 'excluded', values: [] }`
   - **Regular selection:** produces `{ operator: 'in', values: [selectedIds...] }`

Note: `buildQueryFiltersForPythonAttachment()` is identical but formats dates as
`YYYY-MM-DD` (ISO). It is used when building the filter string sent to the Python
code execution environment.

**`buildDataQueryWithMergedFilters(dataQuery, uiFilters)`** in `query-filters.ts:160`

A higher-level function that produces a complete updated `DataQuery`. It:
1. Builds `updatedFiltersFromUI` via `buildQueryFiltersForPythonAttachment`
2. Computes `uiFilterCodes` — the set of dimension IDs the UI is controlling
   (both directly and via shared filter expansion)
3. For any UI-controlled dimension that ends up with no selection,
   adds a wildcard filter `{ operator: 'in', values: ['*'] }` — this explicitly
   tells the API "all values", rather than leaving the filter absent (which could
   be misinterpreted)
4. Keeps any "hidden" filters — `QueryFilter` entries in the original `DataQuery`
   whose `componentCode` is not in the UI-controlled set. These are filters set
   outside the UI (e.g. by the LLM) that the user didn't touch.

---

## 5. Computing the Time Series Key

Alongside the filter values, the app builds a `DatasetQueryFilters` object:

```ts
interface DatasetQueryFilters {
  filterKey: string;   // time-series key: dimension values concatenated in DSD order
  timeFilter: string;  // time period filter string for the SDMX data API
}
```

`getQueryFilters()` in `query-filters.ts:41` produces this. The `filterKey` is
built by `getTimeSeriesFilterKey()` from sdmx-toolkit — it takes the
dimension selections in their DSD-defined order and concatenates them, which
matches the SDMX data URL key format (`A.FRA+DEU.GDP`).

`timeFilter` is built by `getQueryTimePeriodFilters()` from sdmx-toolkit and
represents the time period as a SDMX-formatted period string.

These two strings are what actually get sent to the SDMX data API.

---

## Invariants

- A filter with no selected values and no time range is simply omitted from
  `QueryFilter[]` — there is no "empty selection" serialisation.
- A wildcard (`*`) filter only appears when the UI explicitly cleared a dimension
  that previously had a selection. It is never generated for dimensions that were
  never touched.
- Selected values not present in the current constraint response are still
  preserved in `Filter[]` (for hierarchy codes). They are not persisted to
  `QueryFilter[]` unless they were actually selected.
- `filterType: 'dataset'` is always set on filters passed to serialisation
  functions — shared filters must be expanded first.

