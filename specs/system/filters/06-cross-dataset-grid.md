# Cross-Dataset Grid

When the LLM returns data from two or more datasets simultaneously, a single grid
must display them together. The cross-dataset grid solves this by **concatenating
rows from all datasets into one flat array** — it is not a SQL-style join. Each row
knows which dataset it came from, and every column's value-getter dispatches on that
identity to look up the native dimension ID for that row's dataset.

All logic lives under
`libs/conversation-view/src/utils/attachments/cross-dataset-grid/`.

---

## Pipeline Overview

```
buildCrossDatasetGridAttachment(dataQueries, structuresMap, dataMessagesMap, ...)
  ↓
buildCrossDatasetGridColumns(...)   →  ColDef[]
buildCrossDatasetGridData(...)      →  GridData[]   (one row per time-series per dataset)
  ↓
{ title, gridContent: { columns, data } }   →   ag-grid-react renders it
```

`buildCrossDatasetGridAttachment` is the single entry point. It returns a plain
object that is stored as an attachment on the assistant message and later read by the
grid component to initialise ag-grid.

Two parameters accepted by `buildCrossDatasetGridContent` — `_constraintsMap` and
`_selectedTimePeriod` — are currently unused (underscore-prefixed); they are plumbed
for future use and can be ignored.

---

## Column Layout

Left to right, as produced by `buildCrossDatasetGridColumns`:

| Column group | Source | Notes |
|---|---|---|
| Metadata | `getCrossDatasetMetadataColumn` | Fixed left-anchor column |
| Agency | dataset info | String from structural metadata |
| Dataset name | dataset info | Human-readable dataset title |
| Country / Region | `dimensions-columns.ts` | One column; value dispatched by row urn |
| Indicator(s) | `dimensions-columns.ts` | 1 col in Compact mode; N cols in Extended mode |
| Frequency | `dimensions-columns.ts` | One column; value dispatched by row urn |
| Other dimensions | `dimensions-columns.ts` | Built with `hide: true` |
| Time period | `timeseries-columns.ts` | One column per unique period string |
| Chart | `getChartColumn` | Fixed right-anchor column |

The time period columns are always rightmost before the chart column and are sorted
by `sortPeriods()` from sdmx-toolkit (handles `YYYY`, `YYYY-Q#`, `YYYY-M##`
formats).

---

## Value-Getter Pattern

This is the load-bearing piece. Because each row belongs to a different dataset,
the same "Country" column must look up a different native dimension ID depending on
which dataset the row is from.

Every dimension column's value-getter follows the same pattern:

```ts
function getCellParams(data, structuresMap) {
  const urn = data?.dataset?.urn;
  const structures = urn == null ? undefined : structuresMap.get(urn);
  return { data, urn, structures };
}
```

The runtime flow for, say, the Country column:

1. Read `params.data.dataset.urn` — which dataset this row belongs to
2. Look up `datasetDimensionsSchemesMap.get(urn).region` — the native dimension ID
   that plays the "region/country" role in this dataset (e.g. `REF_AREA` for
   Dataset A, `GEO` for Dataset B)
3. Read `params.data[nativeDimensionId]` — the localised display value already
   embedded in the row

The same dispatch applies to Frequency (`scheme.frequency`) and Time Period
(`scheme.timePeriod`). Indicator columns differ only in which IDs from
`scheme.indicators` are used. "Other" dimensions use `scheme.other`.

This means the column definitions are **shared across all datasets** — there is no
per-dataset column set. The per-dataset variation is entirely inside value-getters.

---

## View Modes

`CrossDatasetGridViewMode` has two values: `Compact` (default) and `Extended`. The
mode only affects the indicator columns.

| Mode | Indicator columns | Cell value |
|---|---|---|
| `Compact` | One column ("Indicator") | All indicator dimension values concatenated with `INDICATORS_CONCATENATION_SYMBOL` (`.`) |
| `Extended` | One column per unique indicator dimension ID across all active datasets | Each column shows the value for its specific indicator dimension, blank if the row's dataset doesn't have that dimension |

Compact is the default and hides multi-dimension complexity behind a single cell.
Extended is useful when datasets have different indicator structures and the user
needs to see each dimension separately.

---

## Row Construction

`buildCrossDatasetGridData` iterates `dataQueries` in order. For each dataset it
calls `getRowsData(timeSeries, ...)` which produces one `GridData` row per
time-series (i.e. per unique combination of non-time dimension values). Time period
values are keyed directly by their period string (e.g. `"2020"`, `"2021-Q1"`).

Each row is then tagged before being pushed to the shared array:

```ts
rows.push(...dsRows.map(row => ({
  ...row,
  dataset: { urn },
  datasetTitle,
})));
```

The final array is a flat concatenation. There is no key-based merging of rows from
different datasets — a "France" row from Dataset A and a "France" row from Dataset B
are two separate grid rows.

`getRowsData` also calls `extendDataWithChart()` to attach chart-rendering metadata
to each row for the chart column.

---

## Time Period Columns

Time periods are **unioned across all datasets** with deduplication.

`collectTimePeriods()` in `timeseries-columns.ts` iterates every entry in
`dataMessagesMap`, collects all period strings into a `Set`, then sorts the result
with `sortPeriods()`. One `ColDef` is emitted per unique period.

Each time-period column's value-getter:

```ts
params.data[period]?.value?.[0]?.value || null
```

where `period` is the column's period string. If the row's dataset has no data for
that period, the cell is `null` (blank).

This means datasets with different time coverages display correctly side-by-side:
Dataset A's 2010–2020 columns are blank for Dataset B's rows when Dataset B only
covers 2015–2022.

---

## Active Dataset Filtering

Before the grid is built, `getCompatibleDatasetUrns()` (see `03-shared-filters-merging.md`)
filters `dataQueries` to only the datasets compatible with the current shared filter
selections. Datasets excluded by country or frequency selections are not passed to
`buildCrossDatasetGridAttachment` and produce no rows or columns.

---

## Snapshot Key

`getCrossDatasetSnapshotKey(dataQueries)` in `multiple-filters.ts:1086`:

```ts
JSON.stringify(dataQueries.map(q => ({ urn: q.urn, filters: q.filters })))
```

This is a **change-detection key**, not a cache key. The component compares the
current snapshot key against the previous one to decide whether to rebuild the grid.
A key change means a different set of active datasets or filter selections — both
require a full rebuild.

---

## Invariants

- Each row carries `dataset.urn`; this is the only way value-getters know which
  native dimension ID to use. Rows without this field would render blank in all
  dimension columns.
- Rows are concatenated, never merged. Two datasets with matching dimension values
  produce two rows, not one.
- Time period columns are derived from the loaded data messages, not from
  constraints. If data for a period is absent from the response, that period's
  column does not appear.
- `sortPeriods()` determines column order; insertion order from `dataMessagesMap`
  does not matter.
- View mode (`Compact`/`Extended`) only changes the indicator column layout.
  Country, Frequency, Time Period, and Other columns are identical in both modes.
- Column definitions are stateless with respect to dataset identity — all
  dataset-specific logic is in value-getters, not in column structure.
