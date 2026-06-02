# Constraints Fetching

SDMX constraints tell the client which dimension-value combinations actually exist
in the data. Without them, a user could select "Annual frequency + Country X" and
get an empty result because that combination doesn't exist. Constraints drive which
checkboxes are enabled in the filter UI and clip the available time range.

This spec covers when constraints are fetched, what is included in the request,
how responses are cached, and how they flow into filter values.

---

## What a Constraint Request Is

The constraint endpoint accepts a dataset URN and an optional list of
`SeriesFilterDto[]` — the current non-time-period selections — and returns a
`DataConstraints` object listing which values are available for every dimension
given those selections. In SDMX terms this is a "content constraint".

```ts
interface SeriesFilterDto {
  componentCode: string;       // dimension ID
  operator: SeriesFilterOperator.EQUALS;
  value: string;               // comma-separated code IDs, e.g. "FRA,DEU"
}
```

The time period dimension is always excluded from the request filters — the
available time range comes from constraint `annotations`, not from cube regions.

---

## Two Fetching Paths

There are two distinct places where constraints are fetched, for different purposes.

### Path 1 — Initial load (`attachments-data.ts`)

`getDataConstraintsMap()` at
`libs/conversation-view/src/utils/attachments/attachments-data.ts:25`

Called during `getStructureDataMaps()` to populate constraints for the first time
when a conversation is opened or a new dataset is added. It uses the filters
already saved in the `DataQuery` (from the system message) as the request input.

Source: `getFiltersDtoMapFromDataQuery()` from sdmx-toolkit — converts each
`DataQuery`'s `QueryFilter[]` to `SeriesFilterDto[]`, excluding the TIME_PERIOD
dimension.

The constraint responses are `Promise.allSettled` — a failure for one dataset
doesn't block the others.

### Path 2 — Interactive updates (`multiple-filters.ts`)

`getConstraintsRequests()` at `multiple-filters.ts:1207`

Called when the user changes filter selections in the UI, to refresh available
values. The key difference from Path 1 is **shared filter exclusion**.

`getConstraintFilters()` at `multiple-filters.ts:1180` decides what to include in
the constraint request:

- If the source filters contain any `SharedFilter` entries (i.e. the UI is in
  multi-dataset mode with merged pickers), **shared filters are excluded** from the
  request — except for `TIME_PERIOD`. This is intentional: sending a shared
  COUNTRY filter with Dataset-A codes to Dataset-B's constraint endpoint would
  produce wrong results because Dataset-B uses different codes.
- If no shared filters are present (single-dataset mode), all filters are sent as-is.
- TIME_PERIOD is always excluded from constraint requests regardless (its range
  comes from annotations).

The result: each dataset's constraint request only includes filters that are
native to that dataset.

---

## Request Cache

All constraint requests (and structure requests) go through a module-level in-memory
cache in `libs/conversation-view/src/utils/request-cache.ts`.

The cache has two layers:

| Map | Contents | Behaviour |
|---|---|---|
| `resolvedRequests` | Completed results | Returned immediately on repeat call |
| `inFlightRequests` | In-progress `Promise`s | Second call awaits the same promise |

This prevents duplicate API calls when multiple components or effects request the
same data simultaneously.

**Cache key:** `buildRequestCacheKey(...parts)` — simply `JSON.stringify(parts)`.
The full key includes the action function's name plus the serialised arguments, so
`getConstraints("urn-A", [{ componentCode: "FREQ", value: "A" }])` has a different
key from `getConstraints("urn-A", [{ componentCode: "FREQ", value: "A,Q" }])`.

**Important:** This cache is **never invalidated during a session**. Once a
constraint response is cached, it stays forever for that page load. A browser
refresh clears it.

### Normalisation for cache consistency

`normalizeConstraintFilters()` at
`libs/conversation-view/src/utils/normalize-constraint-filters.ts:3`

Before building the cache key, filter DTOs are normalised:
1. Values within each filter are sorted (`"FRA,DEU"` → `"DEU,FRA"`)
2. Filters are sorted by `componentCode` alphabetically

This ensures that selecting "France then Germany" vs "Germany then France" produces
the same cache key and doesn't trigger redundant API calls.

### Detecting uncached requests

`hasUncachedConstraintRequests()` at `multiple-filters.ts:1243`

Returns `true` if any dataset in the current query would produce a cache miss.
Used to decide whether a new round of constraint fetching is needed after filter
changes — if everything is cached, skip the async work entirely.

---

## How Constraints Flow Into Filter Values

After constraints are fetched they are stored in `StructureDataMaps.constraintsMap`
as `Map<datasetUrn, DataConstraints[] | undefined>`.

**Applying to filter values:**

`getFilledFilters()` (see `02-single-dataset-filters.md`) calls
`getAvailableCodesFromConstrains()` from sdmx-toolkit. For each dimension it:
1. Takes the full codelist for that dimension
2. Filters to only the codes listed in the constraint's `cubeRegions` where
   `isIncluded = true`
3. For hierarchical codelists, preserves parent codes even if the constraint didn't
   explicitly list them (so the tree renders correctly)
4. Returns localised `FilterValue[]`

Any code absent from the constraint response is simply not returned — the
corresponding checkbox is not shown (or is shown as disabled, depending on context).

**Applying to time range:**

`getAnnotationPeriod(constraints[0].annotations)` from sdmx-toolkit extracts
`TIME_PERIOD_START_ANNOTATION_KEY` and `TIME_PERIOD_END_ANNOTATION_KEY` from the
first constraint's annotations array. This defines the earliest and latest dates
available in the dataset.

`limitTimeRangeByConstraints()` at `multiple-filters.ts:500` clips any
user-selected time range to these bounds. The clamping rules:
- If the entire requested range is **before** the available range → snap both ends
  to the earliest available date
- If the entire requested range is **after** the available range → snap both ends
  to the latest available date
- Otherwise → clip start and end independently

**Initial constraints for the time picker:**

`getInitialConstraints()` at `multiple-filters.ts:1367` handles the time filter
display in the filter panel:
- Single-dataset mode: returns `initialConstraints` directly
- Multi-dataset mode + shared time filter: synthesises a merged constraint whose
  time range is the **union** (earliest start, latest end) across all active
  datasets — so the shared time picker shows the full possible range

---

## Merging Constraint Maps

When constraints are refreshed incrementally (e.g. one dataset's filter changes
while others stay the same), `mergeConstraintsMaps()` at `multiple-filters.ts:1354`
merges the new results over the existing map. Entries from the updated map overwrite
entries in the base map; datasets not in the updated map keep their existing
constraint data.

---

## Invariants

- TIME_PERIOD is never sent as a constraint request filter.
- Shared (COUNTRY, FREQUENCY) filters are never sent to constraint requests in
  multi-dataset mode.
- The request cache never evicts — stale constraints are only possible if the
  underlying data changes during a session (rare for statistical datasets).
- A dataset with `constraintsMap.get(urn) === undefined` (entry absent) means
  constraints haven't loaded yet. A dataset with an empty array `[]` means
  constraints loaded but returned nothing.
