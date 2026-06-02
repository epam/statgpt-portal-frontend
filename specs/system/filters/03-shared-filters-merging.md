# Shared Filters — Merging and Expansion

This is the conceptually hardest part of the system. When two or more datasets are
active simultaneously, the app needs to present a single "Country" picker, a single
"Frequency" picker, and a single "Time Period" picker — even though each dataset
uses different dimension IDs and different code values to represent these concepts.

All of this logic lives in
`libs/conversation-view/src/utils/multiple-filters.ts`.

---

## The Core Problem

Dataset A has a dimension called `REF_AREA` with codes `FRA`, `DEU`, `USA`.
Dataset B has a dimension called `GEO` with codes `FR`, `DE`, `US`.

Both represent "Country/Region". If we show two separate pickers, the user must
select the same country twice. Worse, they might select inconsistent values.

The solution: detect that both dimensions play the `REGION` role (via
`DatasetDimensionsMetadataMap`), **merge their values by name** into one shared
`SharedFilter`, and when the user submits, **expand** that shared filter back into
two separate `DatasetFilter` entries — one for each dataset, using the correct
native codes.

Three dimensions get this treatment, identified by the constants:

```ts
COMMON_COUNTRY_FILTER_ID    = 'COUNTRY'
COMMON_FREQUENCY_FILTER_ID  = 'FREQUENCY'
COMMON_TIME_PERIOD_FILTER_ID = 'TIME_PERIOD'
```

---

## Recognising a Shared Dimension

`SHARED_FILTERS_CONFIG` (`multiple-filters.ts:142`) defines the three shared
filter types and their matching rules:

```ts
[
  { id: 'COUNTRY',     subtype: 'REGION',     getMergedValueKey: nameBasedMatcher },
  { id: 'FREQUENCY',   subtype: 'FREQUENCY',  getMergedValueKey: nameBasedMatcher },
  { id: 'TIME_PERIOD', subtype: undefined,    getMergedValueKey: (v) => v.id },
]
```

`isMatchingSharedFilterConfig()` decides whether a `DatasetFilter` belongs to a
shared filter category. The rules, in priority order:

1. If it's already a `SharedFilter`, match by ID equality.
2. For TIME_PERIOD: match if `filter.isTimeDimension === true`, or if
   `DimensionConfig.dimensionType === 'TIME_PERIOD'`, or if the filter ID is
   literally `'TIME_PERIOD'`.
3. For COUNTRY and FREQUENCY: match if the dimension's `subtype` in
   `DatasetDimensionsMetadataMap` equals `'REGION'` or `'FREQUENCY'`
   respectively. Fallback: match by ID equality (e.g. if a dimension is literally
   named `'COUNTRY'` but has no subtype configured).

This means the subtype from deployment metadata is the primary signal. ID matching
is just a fallback for datasets where deployment config is incomplete.

---

## Merging: `mergeSharedFilters()`

`mergeSharedFilters(filters, datasetDimensionsMetadataMap)` at `multiple-filters.ts:295`

Takes a flat `Filter[]` (mix of dataset-specific filters from all datasets) and
returns a new `Filter[]` where the shared dimensions have been collapsed into
single `SharedFilter` entries.

**Algorithm:**

1. Walk every filter. If it matches a shared config and has a `datasetUrn`, put it
   in a bucket keyed by the shared config ID (`groupedFilters` map). Otherwise
   keep it in `otherFilters`.

2. For each shared config, if the bucket has entries, call
   `mergeSharedFilterValues()` to combine the values, then build one `SharedFilter`.

3. The resulting `SharedFilter` gets:
   - `id`: the shared config ID (`'COUNTRY'`, `'FREQUENCY'`, or `'TIME_PERIOD'`)
   - `filterType: 'shared'`
   - `datasetUrn: undefined`
   - `sourceDatasetUrns`: all dataset URNs that contributed
   - `sourceFilterIdsByDataset`: `{ "urn-A": "REF_AREA", "urn-B": "GEO" }`
   - `dimensionValues`: the merged values (see below)
   - `timeRange`: for TIME_PERIOD, the union of all dataset time ranges

4. Return `[...sharedFilters, ...otherFilters]` — shared filters first, then all
   the dataset-specific filters that didn't match any shared config.

### Merging values: `mergeSharedFilterValues()`

At `multiple-filters.ts:255`. Produces the unified `FilterValue[]` for a shared
filter from multiple datasets' individual filters.

For COUNTRY and FREQUENCY the merge key is the **normalised value name**
(`name.trim().toLowerCase()`). For TIME_PERIOD it's the **value ID** itself.

Name-based matching is why "France" in Dataset A (`FRA`) and "France" in Dataset B
(`FR`) become one entry in the shared filter — they have the same name.

For each unique merge key the result is one `FilterValue` with:
- `id`: the merge key itself (e.g. `"name:france"`)
- `name`: the human-readable label
- `isSelectedValue`: `true` if it was selected in *any* source dataset
- `sourceValues`: one `FilterValueSource` per dataset that had this value

```ts
// Example: shared COUNTRY value for "France"
{
  id: "name:france",
  name: "France",
  isSelectedValue: true,
  sourceValues: [
    { datasetUrn: "urn-A", id: "FRA", name: "France" },
    { datasetUrn: "urn-B", id: "FR",  name: "France" },
  ]
}
```

If a value has no name (unusual but possible), the fallback key is
`"dataset:{urn}:id:{valueId}"` — making it dataset-unique rather than shared.

---

## Expansion: `expandSharedFilter()`

At `multiple-filters.ts:457`. The reverse of merging. Takes one `SharedFilter` and
produces a `DatasetFilter[]` — one per contributing dataset.

**Time dimension path** (`expandSharedTimeFilter`): Simply copies the
`SharedFilter` to each `sourceDatasetUrn`, replacing `id` with the native time
dimension ID and setting `filterType: 'dataset'`. The `timeRange` is preserved
as-is (no per-dataset translation needed for time ranges).

**Non-time dimension path** (`mapSharedDimensionValuesByDataset`): For each
selected `FilterValue` in the shared filter, reads its `sourceValues` to find
which dataset has which native code. Produces one `DatasetFilter` per dataset
with translated `dimensionValues`.

```
SharedFilter "COUNTRY", selected: ["name:france"]
  sourceValues of "name:france":
    { datasetUrn: "urn-A", id: "FRA" }
    { datasetUrn: "urn-B", id: "FR"  }

→ DatasetFilter { datasetUrn: "urn-A", id: "REF_AREA", dimensionValues: [{ id: "FRA", isSelectedValue: true }] }
→ DatasetFilter { datasetUrn: "urn-B", id: "GEO",      dimensionValues: [{ id: "FR",  isSelectedValue: true }] }
```

### Resolving the native dimension ID

`getNativeFilterIdForSharedFilter(filter, datasetUrn, metadataMap)` at
`multiple-filters.ts:356` resolves which dimension ID to use in the expanded
`DatasetFilter`. Priority order:

1. `filter.sourceFilterIdsByDataset[datasetUrn]` — explicit recorded mapping
   (always the first choice; set at merge time)
2. For TIME_PERIOD: look up the dimension with
   `dimensionType === 'TIME_PERIOD'` in the metadata map
3. For COUNTRY/FREQUENCY: look up the dimension with the matching `subtype`

### `buildFiltersMap()`

`buildFiltersMap(filters, constraintsMap, ..., disabledDatasetUrns)` at `multiple-filters.ts:759`

The top-level expansion function. Takes the full UI `Filter[]` (which may contain
both `SharedFilter` and `DatasetFilter` entries), expands all shared filters,
and returns `Map<datasetUrn, Filter[]>` — ready to be serialised per dataset.

Also applies `limitTimeRangeByConstraints()` on any time filter, which delegates
to the private `clipTimeRangeToBounds()` helper. That helper handles the boundary
cases correctly — including when the selection lies entirely outside the available
range — preventing the inverted range (`start > end`) that a naive min/max clip
would produce.

After expansion and time-range clipping, `buildFiltersMap` removes entries for any
dataset URN in `disabledDatasetUrns` from the result map. Expansion itself still
runs over all `sourceDatasetUrns` including disabled ones — the removal is a
post-processing step. The practical effect: disabled datasets are absent from the result map, so their
`DataQuery.filters` are not overwritten — the `...q` spread in
`updatedDataQueries` preserves them untouched.

---

## Display-Safe Filtering: `filterSharedValuesForEnabledDatasets()`

At `multiple-filters.ts:1589`. A **display-only** function — it never mutates
filter state and is never called on the Apply path. `FilterSettings` derives a
`displayFilters` list via `useMemo` from `filtersList`, `disabledDatasetUrns`, and
`initialConstraintsMap`, and passes it to both the left facets panel and the right
values panel instead of the raw `filtersList` state. The useMemo also pre-filters
disabled-dataset `DatasetFilter` entries from `filtersList` before passing to this
function, so the function itself only ever receives enabled-dataset `DatasetFilter`
entries (which it passes through unchanged) and all `SharedFilter` entries.

`filtersList` state is never mutated by this derivation — it remains the full
source of truth for Apply. Mutation callbacks (`onSelectFilterValue`,
`onSelectHierarchicalNodes`, `onExpandHierarchicalValue`) always resolve their
target filter against the full `filtersList` via a `getFullFilter()` helper, not
against `displayFilters`. Values hidden by the display filter are therefore never
accidentally lost when the user interacts with a visible value.

Returns `filters` unchanged when `disabledDatasetUrns.size === 0`.

**`SharedFilter` — Country / Frequency (discrete values):**

Values whose every `sourceValue.datasetUrn` is in `disabledDatasetUrns` are
removed. If no values remain the filter is omitted entirely (facet hidden).
The `isSelectedValue` flags on hidden values are preserved in `filtersList`; when a
dataset is re-enabled the values reappear with their selections intact.

The side-effect is intentional: if the user's only Frequency selection was "Daily"
(from a now-disabled dataset), the visible Frequency facet becomes empty — meaning
"all frequencies" for the remaining enabled datasets. This is the correct widened
result, not a bug.

**`SharedFilter` — Time Period (`isTimeDimension: true`):**

Handled internally by the private `filterTimeDimensionForEnabledDatasets()` helper:

1. Filter `sourceDatasetUrns` to enabled-only. If none remain, omit the filter
   (facet hidden).
2. Recompute the available range as the union of enabled source datasets' annotation
   periods from `constraintsMap` (min of starts, max of ends).
3. Clip the filter's `timeRange` to the recomputed bounds via `clipTimeRangeToBounds`
   (same three-case logic used by `limitTimeRangeByConstraints`).
4. Return the filter with updated `sourceDatasetUrns` and clipped `timeRange`.

The clip is display-only: `filtersList` preserves the original wide range. If the
user re-enables the dataset, `getFiltersPreselectedByDataQueries` reads back the
preserved `DataQuery.filters` and the merged range widens again.

---

## Dataset Compatibility: `getCompatibleDatasetUrns()`

At `multiple-filters.ts:793`. When the user selects specific countries in the
shared COUNTRY filter, not all datasets may have data for those countries. This
function returns the subset of datasets whose data is compatible with the current
shared filter selections.

A dataset is compatible if, for every shared filter that has explicit selections,
at least one selected value has a `sourceValue` pointing to that dataset — OR the
dataset has no filter for that dimension at all (implicit wildcard, meaning it
accepts any value).

The **implicit wildcard** case: Dataset B was loaded but its `REF_AREA` dimension
was never given an explicit filter in the saved `DataQuery`. This means "all
countries" — it doesn't restrict Dataset B's inclusion even if Dataset A has
specific countries selected. `hasImplicitWildcardForSharedFilter()` detects this
by checking whether the dataset's native dimension has an explicit filter in
`appliedFiltersMap` (or in the original `DataQuery` as fallback).

---

## Detecting Filter Asymmetry: `hasImplicitSharedWildcard()`

At `multiple-filters.ts:1273`. A diagnostic function that checks whether the
current state has an "asymmetry" across datasets for a shared dimension: one
dataset has explicit values selected while another dataset has no filter at all.

This matters because when Dataset A selects `FRA` and Dataset B has no filter, the
data result from Dataset B would cover all countries — but the merged grid or chart
would show them side-by-side. This is confusing UX. The system uses this flag to
trigger `getImplicitSharedWildcardFilterParams()` which expands Dataset B's filter
to only include countries that actually exist in its constraints, making the
behaviour explicit.

---

## Expanding Implicit Wildcards: `getDataQueriesWithExpandedSharedDimensionFilters()`

At `multiple-filters.ts:966`. Only runs when there are 2+ datasets and constraints
are available.

For each shared dimension (COUNTRY, FREQUENCY — not TIME_PERIOD), it compares
datasets that have explicit selections with datasets that have no filter. If the
"missing" dataset has available values in its constraints, those values are added to
the explicit dataset's filter — effectively saying "also include any value that
exists in the datasets that don't have an explicit filter yet."

This is a one-directional expansion: it adds to the explicit filter, never removes
from it. The result is that data from all active datasets is included in the merged
result.

---

## Restoring Active Datasets: `getRestoredActiveDatasetUrns()`

At `multiple-filters.ts:889`. When a conversation is reopened, this function
reconstructs which datasets were "active" (deselected datasets are remembered as
inactive). It looks for shared-dimension filters that have explicit non-empty
values. If all datasets that shared any one of those dimensions have those explicit
values, they were all active. If only some do, only those were active.

Returns `undefined` if no shared filter selections exist — meaning all datasets are
active by default.

---

## Summary: Merge → UI → Expand Pipeline

```
Structural data loaded for each dataset
  ↓
getDatasetFilters() per dataset
  → [DatasetFilter[], DatasetFilter[], ...]    (flat, one per dimension per dataset)

mergeSharedFilters()
  → [SharedFilter(COUNTRY), SharedFilter(FREQ), SharedFilter(TIME), DatasetFilter, ...]
                                                (UI-facing: merged pickers + dataset-specific ones)

filterSharedValuesForEnabledDatasets()       ← display path only (useMemo in FilterSettings)
  → displayFilters                             (values from disabled datasets hidden;
                                               Time Period range clipped to enabled bounds)

User selects values in the merged pickers (reads displayFilters; writes to filtersList)
  ↓
buildFiltersMap()                            ← apply path (called in onApply)
  → Map<urn, DatasetFilter[]>                  (expanded back, with native IDs and codes;
                                               disabled-dataset entries removed)

limitTimeRangeByConstraints() / clipTimeRangeToBounds() applied per enabled dataset
  ↓
setDataQueryFilters() per dataset
  → Map<urn, QueryFilter[]>                    (ready for persistence and API calls)
```

---

## Invariants

- A `SharedFilter` never has a `datasetUrn`. Its `sourceDatasetUrns` lists which
  datasets contributed.
- `sourceFilterIdsByDataset` is always populated at merge time and is the primary
  source of truth for which dimension ID to use during expansion. Metadata-based
  lookup is a fallback.
- Time period merging takes the **widest** time range (min of starts, max of ends)
  so the shared time picker shows the full range available across all datasets.
- Time period expansion takes the **narrowest** range allowed by each dataset's
  constraints. `clipTimeRangeToBounds` correctly handles boundary cases where the
  selection lies entirely outside the available range, preventing inverted ranges
  (`start > end`) that a naive min/max clip would produce.
- COUNTRY/FREQUENCY values are matched by name, not by code. Two datasets must use
  the same display name for the same concept to be merged. If names differ, each
  ends up as a separate entry in the shared filter.
- `filterSharedValuesForEnabledDatasets` is display-only. The full `filtersList`
  state — including values hidden by the display filter — is what gets serialised on
  Apply. `buildFiltersMap` independently handles the disabled-dataset exclusion on
  the apply path via its `disabledDatasetUrns` parameter.
- `buildFiltersMap` expands SharedFilters across all `sourceDatasetUrns` including
  disabled ones, then deletes disabled-dataset entries as a post-processing step.
  Callers that invoke `buildFiltersMap` without `disabledDatasetUrns` (or that call
  `expandSharedFilter` directly) will still produce entries for all source datasets.
  This is intentional — for example, `getFiltersForQueryContext` calls
  `buildFiltersMap` without `disabledDatasetUrns` because it is used for query
  context building, not the Apply path.

