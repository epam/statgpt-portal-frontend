# Chart Attachments

The `CUSTOM_CHART` attachment type renders time-series data as an ECharts line chart.
Unlike the grid attachments it is **lazily evaluated**: the chart data object is not
built until the component renders. This spec covers the build pipeline, unit-splitting
logic, the lazy resolver, how filter changes invalidate the cache, and the cross-dataset
variant.

Key files:
- `libs/conversation-view/src/utils/attachments/charting/chart-data.ts`
- `libs/conversation-view/src/utils/attachments/charting/cross-dataset-chart-data.ts`
- `libs/conversation-view/src/utils/attachments/charting/data-uniqueness.ts`
- `libs/conversation-view/src/utils/attachments/charting/split-for-units.ts`
- `libs/conversation-view/src/utils/attachments/charting/chart-config-building.ts`
- `libs/conversation-view/src/components/Attachments/CustomAttachments/CustomChartAttachment.tsx`
- `libs/conversation-view/src/components/Attachments/CustomAttachments/ResponsiveChart.tsx`
- `libs/conversation-view/src/models/charting.ts`

---

## Pipeline Overview

```
Filter change → new DataMessage
  ↓
createChartDataResolver(structures, dataMessage, dataQuery, locale)
  → attachment.getChartingData (lazy closure)
  ↓
CustomChartAttachment renders
  → scheduleDeferredWork(() => getChartingData())  [first call]
  ↓
buildChartData():
  getRowsData()
  → getDimensionsUniquenessByValues()
  → splitForUnits()
  → buildUnit() × N
      → buildChartSeries()
      → filterTimePeriodsByFrequency()
      → buildChartConfig()
  ↓
ChartingData { units[], groups? }
  → ResponsiveEChart renders selected unit
```

---

## Lazy Resolver Pattern

`createChartDataResolver()` (`chart-data.ts`) does not build chart data when called.
It returns a closure that builds on demand and caches the result:

```ts
export function createChartDataResolver(...args): () => ChartingData {
  let cached: ChartingData | undefined;
  return () => (cached ??= buildChartData(...args));
}
```

The `??=` operator ensures `buildChartData` runs exactly once per resolver instance.
Subsequent calls to the returned function return the same `ChartingData` object.

The attachment object stored in React state holds this function:

```ts
{
  charting_data: undefined,      // not pre-built
  getChartingData: resolver,     // lazy closure
}
```

`CustomChartAttachment` calls `getChartingData()` inside `scheduleDeferredWork()`,
deferring the build past the current render. `charting_data` (the pre-built form) is
used when chart data arrives serialized from the backend; `getChartingData` is used
for the live in-session path.

`createCrossDatasetChartingDataResolver()` follows the same closure pattern for the
multi-dataset case.

---

## Unit Splitting

A single dataset response can contain multiple logically distinct charts — for
example, one chart per indicator. `buildChartData()` determines the split
automatically using dimension uniqueness analysis.

### Step 1 — Dimension uniqueness analysis

`getDimensionsUniquenessByValues()` (`data-uniqueness.ts`) scans all rows and, for
each non-time dimension, checks whether its value varies across rows. Dimensions
where every row has the same value are **unique** (constant for this slice).
Dimensions where values differ are **non-unique**.

```
Rows: [{INDICATOR: 'GDP'}, {INDICATOR: 'GDP'}, {INDICATOR: 'GNP'}]
INDICATOR → non-unique  (values vary)

Rows: [{FREQ: 'A'}, {FREQ: 'A'}, {FREQ: 'A'}]
FREQ → unique  (all same value)
```

### Step 2 — Group rows into units

`splitForUnits()` groups rows by their combination of non-unique dimension values.
Each distinct combination becomes a separate `ChartUnit` — rendered as a separate
chart tab in the UI.

```
Non-unique: [INDICATOR]
Row A: INDICATOR=GDP  → unit "GDP"
Row B: INDICATOR=GDP  → unit "GDP"   (same unit, different country series)
Row C: INDICATOR=GNP  → unit "GNP"  (separate unit)
```

A dataset with a single unique indicator combination produces exactly one unit.

### Step 3 — Series within a unit

Within each unit, rows become ECharts series. Series are named using the country
dimension (via `buildSerieKeyTitle()`). Time period values from the row become the
`data` array on each series, one point per period.

---

## MAX_LINES_PER_UNIT Cap

```ts
const MAX_LINES_PER_UNIT = 10;  // chart-data.ts:34
```

`buildUnit()` enforces this limit before building series: if a unit has more than 10
rows, only the first 10 are used for `buildChartSeries()`. The full row set is still
stored in `unit.rows`. The unit carries a `limitedByRowsAmountTo: number | undefined`
flag — set to `10` when the cap is applied, `undefined` otherwise.

`CustomChartAttachment` renders a `ChartLimitationInfo` tooltip when
`limitedByRowsAmountTo` is set, prompting the user to refine their filter selection.

---

## Frequency-Based Time Period Filtering

`filterTimePeriodsByFrequency()` (`chart-data.ts`) checks the frequency dimension
value of the first row in a unit and filters the `timePeriods` array accordingly:

| Row frequency | Periods kept |
|---|---|
| Monthly (`M`) | Monthly periods only |
| Quarterly (`Q`) | Quarterly periods only |
| Annual (`A`) | Annual periods only |
| Missing / other | All periods |

This prevents mismatched x-axis ticks when a unit contains data at a single
frequency. The filtered periods become the x-axis categories in `buildChartConfig()`.

---

## Cross-Dataset Variant

`buildCrossDatasetChartingData()` (`cross-dataset-chart-data.ts`) filters out
disabled datasets (`filter(q => !q.disabled)`) before iterating `dataQueries`.
Disabled datasets are excluded from the chart units array entirely — they contribute
neither `units` nor `groups` entries to the returned `ChartingData`.

The function then iterates the remaining enabled queries and calls `buildChartData()`
per dataset. Each dataset's units are wrapped in a `ChartUnitGroup`:

```ts
interface ChartUnitGroup {
  title?: string;   // localized dataset name
  units: ChartUnit[];
}
```

The returned `ChartingData` carries both `units[]` (flat list of all units across all
datasets) and `groups?: ChartUnitGroup[]` (per-dataset grouping for the UI).

`CustomChartAttachment` flattens groups into `FlatChartUnit[]` for the chart
navigation slider, with each entry tagged by group title for the dataset label
displayed above the chart.

---

## ECharts Config

`buildChartConfig()` (`chart-config-building.ts`) assembles the final ECharts option
object from time periods (x-axis) and series. Fixed properties:

- `animation: false`
- `tooltip.trigger: 'axis'`
- `legend` at the bottom with dynamic `grid.bottom`
- `xAxis.type: 'category'` with `boundaryGap: false`

`ResponsiveEChart` (`ResponsiveChart.tsx`) wraps `echarts-for-react`. On mount and
window resize it measures the legend items using canvas text width estimation, computes
how many rows the legend needs, then adjusts `grid.bottom` to prevent the series lines
from overlapping the legend. This adjustment is imperative (direct resize call) and
runs outside the ECharts option lifecycle.

---

## Sidebar

`ChartSidebar` renders the fixed-dimension context for the currently selected unit.
`getDimensionsInfo()` builds `DimensionInfo[]` from all dimensions **except** the
country dimension. Each entry carries:

- `id` — dimension key
- `title` — localized dimension name
- `value` — that dimension's value in the first row of the unit (what this chart slice
  is fixed at — e.g. `"Indicator: GDP"`)

The country dimension is excluded from the sidebar because it drives series
differentiation within the chart (the legend), not the fixed slice identity. It is
still used by `buildSerieKeyTitle()` for series names.

---

## Filter Response and Cache Invalidation

Both `AttachmentsData.tsx` (single-dataset) and `AttachmentsDataMultipleQueries.tsx`
(multi-dataset) run a `useEffect` on `[structures, dataMessage, dataQuery, locale,
chartStyles]`. When any of these change, a new resolver is created:

```ts
setCustomChartAttachment(prev => ({
  ...prev,
  charting_data: undefined,
  getChartingData: createChartDataResolver(structures, dataMessage, dataQuery, locale, chartStyles),
}));
```

Because the cache lives inside the closure, creating a new resolver discards the old
cache automatically — no explicit invalidation is needed. The GC reclaims the old
closure once the component state update replaces it.

`dataMessage` is the primary trigger: when filters change, new SDMX data is fetched
and the resulting new `DataMessage` lands in state, firing the effect and replacing
the resolver.

---

## Data Model

```ts
// charting.ts
interface ChartingData {
  units: ChartUnit[];
  groups?: ChartUnitGroup[];  // populated in cross-dataset mode only
}

interface ChartUnit {
  config: EChartsOption;                 // ready-to-pass to echarts-for-react
  dimensions: DimensionInfo[];           // sidebar display data
  rows: RowData[];                       // full row set (may exceed MAX_LINES_PER_UNIT)
  limitedByRowsAmountTo: number | undefined;
}

interface ChartUnitGroup {
  title?: string;
  units: ChartUnit[];
}

interface DimensionInfo {
  id: string;
  title: string;   // localized
  value: string;   // localized
}
```

The attachment object in React state:

```ts
{
  charting_data?: ChartingData;      // pre-built (serialized / restored)
  getChartingData?: () => ChartingData;  // lazy resolver (live session)
}
```

Exactly one of these is set at any given time.

---

## Invariants

- `buildChartData` is never called at the point the resolver is created — only at
  first render. If the component is unmounted before it renders, the build never runs.
- The resolver cache is per-instance. Two resolver closures for the same inputs do not
  share a cache. Filter change → new resolver → fresh build on next render.
- `unit.rows` always holds the full dataset rows. `MAX_LINES_PER_UNIT` only limits
  the rows passed to `buildChartSeries()` — the full set is available for future use.
- Country dimension is **excluded** from `DimensionInfo[]` (sidebar) but **included**
  in series naming. These serve different UI purposes: the sidebar shows the fixed
  slice, the series legend shows what varies.
- `groups` in `ChartingData` is `undefined` in single-dataset mode. Code that reads
  `groups` must handle absence.
- Frequency filtering is per-unit, derived from the first row's frequency value. If
  rows in a unit have mixed frequencies (unusual but possible), the first row governs.
- `ResponsiveEChart`'s legend sizing runs outside the ECharts option object. Passing
  `grid.bottom` in the ECharts config has no effect — it is overwritten by the resize
  logic on every mount and window resize event.
