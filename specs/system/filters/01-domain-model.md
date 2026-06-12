# Domain Model

This document covers the core data types that everything else in the filter/merging
system is built on. Read this first; the other specs assume this vocabulary.

---

## The Persistence Layer: `DataQuery` and `QueryFilter`

`DataQuery` (`libs/shared-toolkit/src/models/data-query.ts`) is the **record of
what the user asked for**. One `DataQuery` per active dataset. It is serialised to
JSON and stored in the conversation (see `05-system-message-persistence.md`).

```ts
interface DataQuery {
  title?: string;
  urn: string;                  // SDMX dataflow URN — uniquely identifies the dataset
  sdmx1Source?: string;         // Optional SDMX v1 source override
  metadata: {
    countryDimension: string;   // Dimension ID that plays the "country" role in this dataset
    indicatorDimensions: string[];
    timePeriodDimension?: string;
    keyDimensionIdsInDsdOrder?: string[];
    datasetUrl?: string;
  };
  filters?: QueryFilter[];      // The user's dimension selections, serialised
  disabled?: boolean;           // When true, this dataset is excluded from data loading and display.
                                // Active code always writes an explicit true or false — never
                                // leaves this as undefined. undefined is only encountered when
                                // restoring old conversations that predate this field; it is
                                // treated as false (enabled). No migration is needed.
}
```

`QueryFilter` is a single dimension selection inside a `DataQuery`:

```ts
interface QueryFilter {
  componentCode: string;        // Dimension ID (e.g. "REF_AREA", "FREQ")
  operator: QueryFilterType;    // 'in' | 'between' | 'excluded'
  values: string[];
}
```

Three operators exist:

| Operator | Use case | `values` content |
|---|---|---|
| `in` | User selected specific values | Array of code IDs, e.g. `["FRA","DEU"]` |
| `between` | Time period range | `[startDate, endDate]` formatted as `MM-DD-YYYY` (or ISO for Python attachment) |
| `excluded` | Dimension is explicitly excluded from the query | Empty array |

A wildcard (all values) is represented as `{ operator: "in", values: ["*"] }` using
the `GET_v3_FILTER_ALL = "*"` constant from `@epam/statgpt-sdmx-toolkit`.

---

## The UI Layer: `Filter` and `FilterValue`

`Filter` (`libs/conversation-view/src/models/filters.ts`) is the **runtime
representation** used by the UI. It is derived from `DataQuery` + SDMX structural
data. It lives in React state and is never written to the conversation directly.

`Filter` is a union type:

```ts
type Filter = DatasetFilter | SharedFilter;
```

### `DatasetFilter`

Tied to one dataset:

```ts
interface DatasetFilter extends FilterBase {
  filterType: 'dataset';
  datasetUrn?: string;          // Which dataset owns this dimension
}
```

### `SharedFilter`

Spans multiple datasets (Country, Frequency, Time Period):

```ts
interface SharedFilter extends FilterBase {
  filterType: 'shared';
  datasetUrn?: undefined;                           // Intentionally absent
  sourceDatasetUrns?: string[];                     // All datasets that contributed
  sourceFilterIdsByDataset?: Record<string, string>; // datasetUrn → native dimension ID
}
```

The `sourceFilterIdsByDataset` map is the key to the whole merging story: it
answers "for Dataset A, which dimension ID corresponds to this shared COUNTRY
filter?" Without it, expansion back to per-dataset filters would need to re-run
the matching logic every time.

### `FilterBase` (shared fields)

```ts
interface FilterBase {
  id?: string;                  // Dimension ID (for dataset filters) or shared ID (COUNTRY / FREQUENCY / TIME_PERIOD)
  title?: string;               // Display name
  dimensionValues?: FilterValue[];
  isSelectedFilter?: boolean;   // Whether this filter is currently open in the UI
  isTimeDimension?: boolean;    // True for TIME_PERIOD dimensions
  timeRange?: TimeRange;        // Used instead of dimensionValues for time dimensions
  isHierarchical?: boolean;     // Whether codes have parent-child relationships
  isDisabled?: boolean;
  displayMode?: string;         // 'HIERARCHY' | 'FLAT_LIST' | hierarchy URN
  isExcluded?: boolean;         // Maps to operator: 'excluded' in QueryFilter
}
```

### `FilterValue`

One selectable item inside a filter:

```ts
interface FilterValue {
  id: string;                   // Code ID used in API calls
  name?: string;                // Localised display label
  isSelectedValue?: boolean;
  isExpanded?: boolean;         // Hierarchy node expanded state
  parent?: string;              // Parent code ID for hierarchical codelists
  sourceValues?: FilterValueSource[]; // Only present on shared filter values
}
```

`sourceValues` is the per-value equivalent of `sourceFilterIdsByDataset`. When a
shared filter value is "France", `sourceValues` records:
- Dataset A: `{ datasetUrn: "...A...", id: "FR", name: "France" }`
- Dataset B: `{ datasetUrn: "...B...", id: "FRA", name: "France" }`

This lets `expandSharedFilter` translate the user's "France" selection back to the
correct code in each dataset.

---

## The Structural Layer: Dimensions and Metadata

### `Dimension` (from `@epam/statgpt-sdmx-toolkit`)

Raw SDMX structural metadata for one dimension in a dataset. Comes from the
`/structure` API. Key fields: `id`, `type` (`DimensionType.TIME_DIMENSION` or
regular), reference to codelist.

### `DatasetDimensionsMetadataMap`

Deployment-time configuration (`libs/sdmx-toolkit/src/models/datasets-metadata.ts`).
Built from the server response at startup:

```ts
type DatasetDimensionsMetadataMap = Record<
  ShortUrn,                             // Short dataset identifier
  Record<DimensionKey, DimensionConfig> // dimensionId → config
>;

interface DimensionConfig {
  alias: string | null;
  subtype?: 'FREQUENCY' | 'REGION' | null;
  dimensionType: 'INDICATOR' | 'NON_INDICATOR' | 'TIME_PERIOD';
  allValues: DimensionAllValues | null;
}
```

This is how the system knows that `REF_AREA` in Dataset A and `GEO` in Dataset B
are both the "region/country" dimension — they both have `subtype: 'REGION'`.

The same server response also carries a per-dataset `last_updated_at` timestamp
(snake_case, as serialised by the backend). It is not filter-related: it is
collected into `DatasetLastUpdatedMap` (`Record<ShortUrn, string>`) by
`buildDatasetLastUpdatedMap`, exposed via `getDatasetLastUpdated` on
`DatasetDimensionsMetadataMapContext`, and used to display the "Last updated"
date in dataset metadata panels (with the SDMX `lastUpdatedAt` annotation as a
fallback).

### `DatasetDimensionsScheme`

A lightweight derived summary per dataset (`libs/sdmx-toolkit/src/models/dataset-dimensions-scheme.ts`):

```ts
interface DatasetDimensionsScheme {
  timePeriod: string | undefined;  // The time dimension ID
  frequency: string | undefined;   // The frequency dimension ID
  region: string | undefined;      // The country/region dimension ID
  indicators: string[];            // Indicator dimension IDs
  other: string[];                 // All other dimension IDs
}
```

Used primarily by the cross-dataset grid to know which column goes where.

---

## The Constraint Layer: `DataConstraints`

SDMX constraints (`libs/sdmx-toolkit/src/models/structural-metadata/constraints.ts`)
tell the client which dimension-value combinations actually exist in the data:

```ts
interface DataConstraints {
  cubeRegions?: CubeRegion[];
  annotations?: ...;            // Contains TIME_PERIOD start/end keys
}

interface CubeRegion {
  isIncluded?: boolean;         // true = listed values are included; false = excluded
  memberSelection?: MemberSelection[];
}

interface MemberSelection {
  included: boolean;
  componentId: string;          // Dimension ID
  selectionValues: MemberSelectionValue[];
}

interface MemberSelectionValue {
  memberValue: string;          // Allowed code
}
```

In practice the app calls the constraints endpoint with the user's current
non-shared filter selections as input and gets back the allowed values for all
other dimensions. This makes it so that selecting "Annual" in Frequency greys out
countries that have no annual data.

The time range is not in `cubeRegions` — it lives in `annotations` under the keys
`TIME_PERIOD_START_ANNOTATION_KEY` and `TIME_PERIOD_END_ANNOTATION_KEY`, extracted
by `getAnnotationPeriod()` from `@epam/statgpt-sdmx-toolkit`.

---

## How the Layers Relate

```
Deployment config
  └─ DatasetDimensionsMetadataMap   (static, loaded once)
       └─ tells us which dimension plays which semantic role

SDMX Structural API
  └─ Dimension[]                    (per dataset, loaded on first use)
       └─ combined with codelists → FilterValue[]

SDMX Constraints API
  └─ DataConstraints[]              (per dataset, re-fetched on filter changes)
       └─ limits which FilterValues are enabled

User interaction
  └─ Filter[] (React state)         (merged/shared filters shown in UI)
       └─ on submit → QueryFilter[] (per-dataset, stored in DataQuery)
            └─ DataQuery[]          (stored in system message, sent to LLM)
```

The central asymmetry to keep in mind: the **UI works with merged `Filter[]`**
(one picker for Country across all datasets), but the **API always receives
per-dataset `QueryFilter[]`** (each dataset gets its own native dimension ID and
code values). The merging and expansion code in `multiple-filters.ts` is what
bridges these two representations.
