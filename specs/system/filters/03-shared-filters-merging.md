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

`buildFiltersMap(filters, constraintsMap, ...)` at `multiple-filters.ts:764`

The top-level expansion function. Takes the full UI `Filter[]` (which may contain
both `SharedFilter` and `DatasetFilter` entries), expands all shared filters,
and returns `Map<datasetUrn, Filter[]>` — ready to be serialised per dataset.

Also applies `limitTimeRangeByConstraints()` on any time filter: clips the user's
selected time range to the bounds the constraint says are available for that
dataset.

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

User selects values in the merged pickers
  ↓
buildFiltersMap()
  → Map<urn, DatasetFilter[]>                  (expanded back, with native IDs and codes)

limitTimeRangeByConstraints() applied per dataset
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
  constraints.
- COUNTRY/FREQUENCY values are matched by name, not by code. Two datasets must use
  the same display name for the same concept to be merged. If names differ, each
  ends up as a separate entry in the shared filter.

