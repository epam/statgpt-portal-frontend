# Design: Dataset Disable Filter Facet

**Date:** 2026-05-21  
**Author:** Mikhail Hahalushka  
**Status:** Approved — ready for implementation

---

## Overview

Add a "Dataset" filter facet to the filter modal that lets users enable/disable individual datasets from all views (grid, chart, chat display, Python attachment). All datasets are enabled by default. The last remaining enabled dataset cannot be unchecked. The facet appears in both single-dataset and multi-dataset mode; in single-dataset mode the facet row is clickable and shows the right panel, but the single dataset checkbox is always disabled.

---

## 1. Data Model

### `DataQuery` (libs/shared-toolkit/src/models/data-query.ts)

Add one optional field:

```ts
interface DataQuery {
  // ... existing fields unchanged ...
  disabled?: boolean; // true = excluded; false = enabled; undefined = enabled (legacy conversations)
}
```

In active code `disabled` is always set to an explicit `true` or `false` — never left as `undefined`. Conversations restored from JSON may carry `undefined` (field absent) for datasets that were never touched; this is treated as `false`. No migration is needed.

The same field is added to `JsonDataQuery` (the backward-compat interface for older conversations).

**No changes to the `Filter` union type** (`DatasetFilter`, `SharedFilter`, `FilterBase`).

---

## 2. Filter Modal UI

### New component: `DatasetSelectorFacet`

Location: `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersFacets/DatasetSelectorFacet.tsx`

Props:
```ts
interface DatasetSelectorFacetProps {
  dataQueries: DataQuery[];
  disabledDatasetUrns: Set<string>;
  isSelected: boolean;
  onSelect: () => void;
  onClearAll: () => void;
}
```

Rendering:
- First item in the left facets panel, above all dimension filters.
- Always clickable — clicking it selects the facet and shows `DatasetValuesPanel` on the right.
- Counter shows `enabled/total`: `(dataQueries.length - disabledDatasetUrns.size) / dataQueries.length` (e.g., `1/6`).
- Clear (⊗) icon is shown only when `disabledDatasetUrns.size > 0`.

### New component: `DatasetValuesPanel`

Location: `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersValuesPanel/DatasetValuesPanel.tsx`

Props:
```ts
interface DatasetValuesPanelProps {
  dataQueries: DataQuery[];
  disabledDatasetUrns: Set<string>;
  onToggleDataset: (urn: string, enabled: boolean) => void;
}
```

Rendering:
- Search input at the top (filters the dataset list in real time).
- Checkbox row per dataset (dataset title as label). A dataset is checked when its URN is not in `disabledDatasetUrns`.
- A checkbox is `disabled` when it is the only currently enabled dataset: `!disabledDatasetUrns.has(urn) && disabledDatasetUrns.size === dataQueries.length - 1`.
- When a checkbox is `disabled`, only the checkbox icon is visually dimmed — the label text remains at full opacity so the user can still read which dataset cannot be deselected.

### Changes to `FiltersFacetsList`

Additional props: `disabledDatasetUrns: Set<string>`, `isDatasetFacetSelected: boolean`, `onSelectDatasetFacet: () => void`, `onClearAllDatasets: () => void`.

- Renders `<DatasetSelectorFacet>` as the first item before the existing `filtersList.map(...)` loop.
- Skips any `filter.filterType === 'dataset'` entry whose `filter.datasetUrn` is in `disabledDatasetUrns`. Shared filters (Country, Frequency, Time Period) always render regardless of dataset state.

### Changes to `FilterSettings`

Additional props: `disabledDatasetUrns: Set<string>`, `onToggleDataset`, `onClearAllDatasets`.

- Adds internal state: `isDatasetFacetSelected: boolean` (initially `true`).
- When `DatasetSelectorFacet` is clicked: sets `isDatasetFacetSelected = true`, clears `selectedFilter`.
- When a regular filter is clicked: sets `isDatasetFacetSelected = false`.
- Right-panel switch: `{isDatasetFacetSelected ? <DatasetValuesPanel .../> : <FiltersValuesPanel .../>}`.

---

## 3. State Management

### `MultiDatasetFilters`

New state:
```ts
const [disabledDatasetUrns, setDisabledDatasetUrns] = useState<Set<string>>(new Set());
```

- On modal **open**: `new Set(dataQueries.filter(q => q.disabled).map(q => q.urn))`.
- On modal **cancel**: discarded.
- On modal **apply**: compute `updatedDataQueries` and pass to `onMultipleDataFiltersChange`:
  ```ts
  const updatedDataQueries = dataQueries.map(q => ({
    ...q,
    disabled: disabledDatasetUrns.has(q.urn),
  }));
  ```
  Every dataset receives an explicit `true` or `false`. Re-enabling a dataset (removing its URN from `disabledDatasetUrns`) must explicitly set `disabled: false` — returning the original stored object is wrong because it may carry a stale `disabled: true` from a previous apply. Disabled datasets are included in `updatedDataQueries` — the compatible/incompatible URN filtering that also runs in `onApply` is for cross-dataset dimension compatibility and is unrelated to disabled state.

`addSystemMessage` closes over `disabledDatasetUrns` and computes `updatedDataQueries` with the same logic internally, adding `disabledDatasetUrns` to its `useCallback` dependency array.

New handlers:
```ts
const onToggleDataset = (urn: string, enabled: boolean) => {
  setDisabledDatasetUrns(prev => {
    const next = new Set(prev);
    enabled ? next.delete(urn) : next.add(urn);
    return next;
  });
};
```

Updated `onClearAllFilters`:
```ts
const onClearAllFilters = () => {
  // existing dimension filter clear ...
  setDisabledDatasetUrns(new Set());
};
```

### `Filters.tsx` (single-dataset)

Passes `disabledDatasetUrns` (always an empty `Set`) and a no-op `onToggleDataset` to `FilterSettings`.

### Applied filters count

The "Applied filters: N" counter in `FilterSettings` is:

```ts
const totalApplied = allAppliedFilters + disabledDatasetUrns.size;
```

---

## 4. Persistence

### Write path (`system-message.ts → prepareSystemMessage`)

`disabled` is always serialized as an explicit boolean:

```ts
data: JSON.stringify({
  urn: dataQuery.urn,
  metadata: dataQuery.metadata,
  filters: ...,
  disabled: !!dataQuery?.disabled,
})
```

Existing conversations that pre-date this field will restore with `disabled` absent from JSON; the restore path treats absence as `false`.

### Restore path

`DataQuery` objects reconstructed from conversation JSON carry `disabled: true` when previously set, restoring the disabled state across page reloads.

---

## 5. Downstream Effects

### Python attachment (`python-attachment.ts`)

`invokePythonAttachment` passes `dataQueries` to the API without transformation. The `disabled` flag is included in the serialized payload automatically. The caller of `invokePythonAttachment` must supply the `updatedDataQueries` produced in `onApply` (see Section 3).

### Cross-dataset grid (`build-cross-dataset-grid-data.ts`)

`buildCrossDatasetGridData` iterates `dataQueries` to build rows from `dataMessagesMap`. Disabled datasets are excluded by filtering before the loop:

```ts
dataQueries.filter(q => !q.disabled).forEach((dataQuery) => { ... })
```

### Chart attachments (`cross-dataset-chart-data.ts`)

Series construction is skipped for disabled datasets. Series belonging to a disabled dataset's URN are excluded from the chart units array.

### Chat view system message display

**Excluded from diff summary:** `getAttachmentInfoList` in `attachments-details.ts` processes only enabled datasets before building the filter-change summary. Disabled datasets produce no rows.

**"Dataset set to" section (`AttachmentDetails`):** When any dataset is disabled, a new section appears at the top of the filter-change summary — before Country, Frequency, and other filter rows — showing the active (enabled) dataset names as pill chips:

```
Dataset set to  [WEO chip]  [Production Indexes chip]  ...
```

This section is absent when all datasets are enabled (the default state).

**Per-dataset filter rows (`AttachmentDetailsItem`):** When a per-dataset indicator filter changes (e.g. "Production index set to ABC"), the dataset name chip appears inline at the end of that row rather than as a standalone header above it:

```
Production index set to ABC  [Production Indexes chip]
```

Shared filters (Country, Frequency, Time Period) never carry a dataset chip since they apply across all datasets.

### Filter panel visibility

Per-dataset `DatasetFilter` items for disabled datasets are hidden from the left facets panel (see `FiltersFacetsList` changes in Section 2). The underlying `QueryFilter` data in the `DataQuery` is preserved, so filter selections are restored when the dataset is re-enabled.

---

## 6. Clear All Behaviour

| Trigger | Behaviour |
|---|---|
| Global "Clear All" button | Clears all dimension filter selections and calls `setDisabledDatasetUrns(new Set())` |
| Dataset facet clear (⊗) icon | Calls `setDisabledDatasetUrns(new Set())`; dimension filter selections are unchanged |

---

## 7. Spec Updates Required After Implementation

| Spec file | What to update |
|---|---|
| `specs/system/filters/01-domain-model.md` | Add `DataQuery.disabled` field |
| `specs/system/filters/05-system-message-persistence.md` | Document `disabled` in serialized JSON |
| `specs/system/filters/07-data-flow.md` | Add dataset-disable step to the apply sequence |
| `specs/system/filters/08-python-attachment.md` | Document `disabled` flag passed through |
| `specs/system/filters/09-applied-filters-display.md` | Document disabled datasets excluded from chat view |
| `specs/system/filters/10-chart-attachments.md` | Document disabled dataset series skipped |

---

## 8. Files Touched

| File | Change |
|---|---|
| `libs/shared-toolkit/src/models/data-query.ts` | Add `disabled?: boolean` to `DataQuery` and `JsonDataQuery` |
| `libs/conversation-view/src/utils/system-message.ts` | Serialize `disabled` in `prepareSystemMessage` |
| `libs/conversation-view/src/utils/attachments-details.ts` | Filter disabled datasets from chat display |
| `libs/conversation-view/src/utils/attachments/charting/cross-dataset-chart-data.ts` | Skip disabled dataset series |
| `libs/conversation-view/src/components/Attachments/AttachmentDetails/AttachmentDetails.tsx` | Add "Dataset set to" section when datasets are disabled |
| `libs/conversation-view/src/components/Attachments/AttachmentDetails/AttachmentDetailsItem.tsx` | Move dataset chip inline after filter values; remove standalone chip header |
| `libs/conversation-view/src/components/Attachments/AttachmentRenderer.tsx` | Pass `dataQueries` to `AttachmentDetails` |
| `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersValuesPanel/FiltersSearchInput.tsx` | **New** — shared search input used by both `FiltersValuesPanel` and `DatasetValuesPanel` |
| `libs/ui-components/src/components/Checkbox/Checkbox.tsx` | Add `disabledScope` prop to control whether disabled styling applies to icon only or full label |
| `libs/conversation-view/src/models/filters.ts` | No changes |
| `libs/conversation-view/src/components/AdvancedView/MultiDatasetFilters/MultiDatasetFilters.tsx` | Add `disabledDatasetUrns` state, `onToggleDataset`, updated `onClearAllFilters`, `onApply`, `addSystemMessage` |
| `libs/conversation-view/src/components/AdvancedView/Filters/Filters.tsx` | Pass `disabledDatasetUrns` and no-op `onToggleDataset` to `FilterSettings` |
| `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersSettings.tsx` | Add `isDatasetFacetSelected` state, right-panel switch, new props |
| `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersFacets/FiltersFacetsList.tsx` | Render `DatasetSelectorFacet` first, hide disabled-dataset filters |
| `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersFacets/DatasetSelectorFacet.tsx` | **New** |
| `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersValuesPanel/DatasetValuesPanel.tsx` | **New** |
| `libs/conversation-view/src/utils/attachments/cross-dataset-grid/build-cross-dataset-grid-data.ts` | Filter rows from disabled datasets |
