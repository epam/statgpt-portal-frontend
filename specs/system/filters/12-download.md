# Download

After a user narrows down a dataset with filters, they can download the result as a
file (CSV, SDMX-CSV, etc.). This spec covers how the currently-applied query state
reaches the download request — for a single active dataset and for multiple datasets
at once — and where that state can go stale if a new code path skips the resolution
described here.

Key files:
- `libs/conversation-view/src/components/Attachments/AttachmentRenderer.tsx`
- `libs/conversation-view/src/components/AdvancedView/AdvancedView.tsx`
- `libs/download-panel/src/components/DownloadSettings/DownloadSettings.tsx`
- `libs/download-panel/src/utils/get-filter.ts`
- `libs/download-panel/src/models/download-dataset-item.ts`
- `libs/download-panel/src/models/download-request.ts`
- `libs/sdmx-toolkit/src/models/dataset-query-filters.ts`
- `apps/portals-example/src/components/ConversationView/ConversationViewWrapper.tsx`

---

## Two Download Paths: Single vs Multi Dataset

`AttachmentRenderer` builds a `downloadDatasets: DownloadDatasetItem[] | undefined`
memo, populated only when the selected attachment is a cross-dataset grid:

```tsx
const downloadDatasets = useMemo<DownloadDatasetItem[] | undefined>(() => {
  if (!selectedAttachment || !isCrossDatasetGrid(selectedAttachment))
    return undefined;
  // ...counts rows per dataset urn from the grid's own rows...
  return Array.from(urnToCount.entries()).map(([urn, rowCount]) => ({
    urn,
    name: urnToName.get(urn) ?? urn,
    rowCount,
    dataQuery: dataQueries?.find((q) => q.urn === urn),
  }));
}, [selectedAttachment, dataQueries]);
```

`DownloadSettings.onDownloadClick` branches on whether this array is populated:

| Mode | `downloadDatasets` | Query source for each item |
|---|---|---|
| Single-dataset | `undefined` | The component's `dataQuery`/`filters`/`urn` props |
| Multi-dataset (cross-dataset grid) | `DownloadDatasetItem[]` | Each item's own `dataQuery`, already resolved above |

```tsx
const items =
  downloadDatasets && downloadDatasets.length > 0
    ? downloadDatasets
        .filter((dataset) => selectedDatasetUrns.has(dataset.urn))
        .map((dataset) => getRequestItem(dataset.dataQuery, dataset.urn, ...))
    : [getRequestItem(dataQuery, dataQuery?.urn || urn || '', ...)];
```

A single-dataset download never touches `downloadDatasets`, and a multi-dataset
download never reads the top-level `dataQuery` prop — the two paths are fully
separate once they reach `DownloadSettings`.

---

## Single-Dataset Query Resolution — `resolvedDataQuery`

For single-dataset mode, `AttachmentRenderer` is handed two independent pieces of
state as props, sourced from `ConversationViewWrapper.tsx`:

- `currentDataQuery: DataQuery | undefined` — a single "selected dataset" query.
  Its only setter, `actions.updateCurrentDataQuery`, is called from dataset-tab
  selection (`AdvancedView.tsx`'s `onSelectDataset`) and from `useDatasets` —
  **never** from the filter-apply pipeline.
- `dataQueries: DataQuery[] | undefined` — kept fresh on every filter Apply: the
  mode strategy's `buildSystemMessage` (`use-single-filter-strategy.ts`) produces a
  new `nextDataQueries` array, which reaches this state via `updateDataQueries`
  (see `05-system-message-persistence.md`).

Because `currentDataQuery` is never refreshed by Apply, it can hold a stale
`DataQuery` (old `.filters`) for the same dataset that `dataQueries` already has
current data for. `AttachmentRenderer` resolves this before handing a `DataQuery` to
`DownloadSettings`, by looking up the matching entry from `dataQueries` by `urn`:

```tsx
const resolvedDataQuery = useMemo(
  () =>
    dataQueries?.find((q) => q.urn === currentDataQuery?.urn) ??
    currentDataQuery,
  [dataQueries, currentDataQuery],
);
```

`resolvedDataQuery` — not the raw `currentDataQuery` prop — is what gets passed as
`DownloadSettings`'s `dataQuery` prop. This mirrors the same find-by-urn-with-fallback
pattern `AdvancedView.tsx`'s `onSelectDataset` already uses when switching tabs.

## Multi-Dataset Query Resolution — `downloadDatasets`

Multi-dataset mode has no equivalent staleness risk. The `downloadDatasets` memo
(above) looks up each dataset's `dataQuery` directly from `dataQueries` by `urn`,
every time it recomputes — it never reads `currentDataQuery` at all.

---

## Building the Request — `getDownloadFilters`

`libs/download-panel/src/utils/get-filter.ts`. Given a `type`, a `dataQuery`, the
dataset's `dimensions`, and a separately-tracked `filters: DatasetQueryFilters`
(`{ filterKey, timeFilter }`, updated by `AdvancedView.handleFiltersChange` on every
filter change), it resolves the actual filter key to send with the download request.
**All three of the branches below are gated on `type === DATA_IN_TABLE`** — there is
no branch for any other `type`:

| Order | Condition (all require `type === DATA_IN_TABLE`) | Source |
|---|---|---|
| 1 | `dataQuery.metadata.keyDimensionIdsInDsdOrder` is non-empty | `getFiltersFromMetadata(dataQuery)` — built from `dataQuery.filters` |
| 2 | Step 1 produced nothing | The separately-passed `filters` prop |
| 3 | Steps 1–2 both produced nothing | Built from `dimensions` + `dataQuery.filters` (`getTimeSeriesFilterKey`/`getTimeQueryFilter`) |
| — | `type !== DATA_IN_TABLE` (e.g. `FULL_DATASET`) | None of the above run — always `{ filterKey: null, timeFilter: null }` |

`AttachmentRenderer.tsx` is the only current caller of `DownloadSettings`, and it
hardcodes `downloadType = DownloadType.DATA_IN_TABLE` — so in practice, one of
branches 1–3 always applies for this component's downloads today.
`DownloadType.FULL_DATASET` exists only as `DownloadSettings`'s default parameter
value; no current caller passes it explicitly.

Step 1 is checked first and matches almost any real `dataQuery`, so **`dataQuery` is
the authoritative source for `DATA_IN_TABLE` downloads, not `filters`.** This is why
a stale `dataQuery` is never masked by a correct `filters` prop — it wins outright,
which is exactly what made the `resolvedDataQuery` fix above necessary rather than
optional.

---

## Invariants

- A single-dataset download's `filterKey` is built from `dataQuery.metadata`/
  `dataQuery.filters` (`getDownloadFilters` step 1), not from the `filters` prop, as
  long as the dataset's DSD declares any key dimensions — which is the normal case.
- `currentDataQuery` must never be read directly for anything filter-sensitive inside
  `AttachmentRenderer` (or a sibling fed the same prop) — always go through
  `resolvedDataQuery`. Reading the raw prop silently reintroduces the staleness
  described above, since nothing in the filter-apply pipeline updates it.
- `downloadDatasets` builds each entry's `dataQuery` fresh from `dataQueries` on every
  recompute; it has no separate "current selection" state to go stale.
