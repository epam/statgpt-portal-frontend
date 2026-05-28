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

- Adds internal state: `isDatasetFacetSelected: boolean` (initially `false`).
- When `DatasetSelectorFacet` is clicked: sets `isDatasetFacetSelected = true`, clears `selectedFilter`.
- When a regular filter is clicked: sets `isDatasetFacetSelected = false`.
- On modal **open** (in both `Filters.tsx` and `MultiDatasetFilters.tsx`): `selectedFilter` is pre-set to the first non-time-period filter (`find(f => !f.isTimeDimension)`), which is Country/Region in practice.
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
| `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersSettings.tsx` | Add `isDatasetFacetSelected` state, right-panel switch, new props; add `displayFilters` derived via `useMemo` (Section 9) |
| `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersFacets/FiltersFacetsList.tsx` | Render `DatasetSelectorFacet` first, hide disabled-dataset filters |
| `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersFacets/DatasetSelectorFacet.tsx` | **New** |
| `libs/conversation-view/src/components/AdvancedView/Filters/FiltersModal/FiltersValuesPanel/DatasetValuesPanel.tsx` | **New** |
| `libs/conversation-view/src/utils/attachments/cross-dataset-grid/build-cross-dataset-grid-data.ts` | Filter rows from disabled datasets |
| `libs/conversation-view/src/utils/multiple-filters.ts` | Add `filterSharedValuesForEnabledDatasets` and private helpers `filterTimeDimensionForEnabledDatasets`, `clipTimeRangeToBounds`; add `disabledDatasetUrns` param to `buildFiltersMap` with post-processing removal (Section 9 — see §9.4 for implementation note) |

---

## 9. Shared Filter Value Filtering

**Date added:** 2026-05-25

Section 2 of this spec hides dataset-specific facets when a dataset is disabled. This section closes the remaining gap: shared filters (Country, Frequency, Time Period) must also react — hiding values that belong exclusively to disabled datasets, and updating the Time Period range.

---

### 9.1 Design Decisions

**Country / Frequency — preserve selections internally:**
When a value's only source datasets are all disabled, the value is hidden from the display but its `isSelectedValue` flag is preserved untouched in `modalFilters`. When the dataset is re-enabled, the value reappears with its selection intact. This is consistent with the existing pattern for dataset-specific filters (Section 2) and with how `DataQuery.filters` are preserved for disabled datasets.

The side-effect is intentional: if the user's only Frequency selection was "Daily" (from a now-disabled dataset), the visible Frequency facet becomes empty — meaning "all frequencies" for the remaining enabled datasets. This is the correct widened result, not a bug.

**Time Period — clip display, preserve original range:**
Time Period is a continuous range, not discrete values. Two things happen when a dataset is disabled:

1. **Available range updates**: the calendar's bounds are recomputed using only enabled datasets' constraints (union of enabled `sourceDatasetUrns` ranges). The calendar no longer lets the user pick dates in the dead zone.
2. **Selected range clips**: if the user's current `timeRange` selection extends beyond the new available bounds, it is clipped to fit — but only in `displayFilters`. `modalFilters` preserves the original wide range.

Re-enabling restores the original range: the disabled dataset's `DataQuery.filters` (which carry the original time selection) are preserved across Apply (see Section 9.3), so `getFiltersPreselectedByDataQueries` reads them back and the merged range widens again.

**Facet visibility:**
A shared filter facet is hidden entirely when all its contributing `sourceDatasetUrns` are disabled — the same rule applied to individual values. An empty facet with no visible values serves no purpose.

---

### 9.2 Data Flow: `displayFilters` in `FilterSettings`

`FilterSettings` derives a `displayFilters` list via `useMemo` and passes it to both panels instead of `modalFilters`:

```ts
const displayFilters = useMemo(
  () => filterSharedValuesForEnabledDatasets(modalFilters, disabledDatasetUrns, constraintsMap),
  [modalFilters, disabledDatasetUrns, constraintsMap],
);
```

- `FiltersFacetsList` (left panel) receives `displayFilters` — facet counters and visibility are correct.
- `FiltersValuesPanel` (right panel) receives `displayFilters` — checkboxes and time picker show only relevant values/range.
- `modalFilters` state is never mutated by this derivation — it remains the full source of truth for Apply.

`constraintsMap` is needed for Time Period range clipping and is already available in `FilterSettings`.

---

### 9.3 New Utility: `filterSharedValuesForEnabledDatasets`

Location: `libs/conversation-view/src/utils/multiple-filters.ts`

```ts
export const filterSharedValuesForEnabledDatasets = (
  filters: Filter[],
  disabledDatasetUrns: Set<string>,
  constraintsMap?: Map<string, DataConstraints[] | undefined>,
): Filter[]
```

Returns early with `filters` unchanged when `disabledDatasetUrns.size === 0`.

**`DatasetFilter` entries:** passed through unchanged — they are already handled by the existing disabled-dataset filter in `FiltersFacetsList`.

**`SharedFilter` — Country / Frequency (discrete values):**

```ts
const filteredValues = filter.dimensionValues?.filter(value =>
  value.sourceValues?.some(sv => !disabledDatasetUrns.has(sv.datasetUrn ?? ''))
) ?? [];
```

- Values with at least one enabled `sourceValue.datasetUrn` are kept.
- If `filteredValues` is empty → omit this filter from the returned array (facet hidden).
- Otherwise return the filter with trimmed `dimensionValues`.

**`SharedFilter` — Time Period (`isTimeDimension: true`):**

1. Compute `enabledSourceUrns = sourceDatasetUrns.filter(urn => !disabledDatasetUrns.has(urn))`.
2. If `enabledSourceUrns` is empty → omit this filter from the returned array (facet hidden).
3. Recompute the available range as the union of enabled source datasets' annotation periods from `constraintsMap` (min of starts, max of ends).
4. Clip the filter's `timeRange` (user selection) to the new available bounds using the shared `clipTimeRangeToBounds()` helper, which handles three cases: selection entirely before the available range → clamp to `{availableStart, availableStart}`; entirely after → clamp to `{availableEnd, availableEnd}`; overlap → standard `{max(start, available), min(end, available)}` clip. This prevents inverted ranges (`start > end`) that a naive min/max would produce.
5. Return the filter with updated `sourceDatasetUrns` (enabled only) and clipped `timeRange`.

---

### 9.4 Apply Path: Skip Disabled Datasets During Expansion

**Problem:** `expandSharedTimeFilter` and `mapSharedDimensionValuesByDataset` expand a SharedFilter to ALL `sourceDatasetUrns`, including disabled ones. If the result is written back as-is, disabled datasets' saved `DataQuery.filters` would be overwritten on every Apply — losing the original selections.

**Actual implementation:** `expandSharedTimeFilter` and `mapSharedDimensionValuesByDataset` are left unchanged — they still expand all source datasets. Instead, `buildFiltersMap` accepts an optional `disabledDatasetUrns: Set<string>` parameter and removes those entries from the result map as a post-processing step after expansion:

```ts
// buildFiltersMap — after expand + limitTimeRangeByConstraints loop
if (disabledDatasetUrns.size > 0) {
  for (const urn of disabledDatasetUrns) {
    result.delete(urn);
  }
}
```

**Result:**

| Dataset state | In `filtersParamsMap` on Apply | `DataQuery.filters` after Apply |
|---|---|---|
| Enabled | ✅ Updated with current selections | Fresh selections saved |
| Disabled | ❌ Absent (deleted from map) | Original selections preserved via `...q` spread in `updatedDataQueries` |

Note: `onMultipleDataFiltersChange` treats a dataset absent from `filtersParamsMap` as "preserve existing filters" — this is the expected invariant and was confirmed during implementation.

---

### 9.5 Spec Updates Required After Implementation

| Spec file | What to update |
|---|---|
| `specs/system/filters/03-shared-filters-merging.md` | Document that disabled datasets are skipped during SharedFilter expansion in `expandSharedTimeFilter` and `mapSharedDimensionValuesByDataset` |
| `specs/system/filters/07-data-flow.md` | Add the `filterSharedValuesForEnabledDatasets` display-filter step and the disabled-dataset skip in the Apply sequence |
