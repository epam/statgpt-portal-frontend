# Filters & Dataset Merging — Spec Index

> **Scope is broader than "filters."** This folder documents the full lifecycle
> of how users select data dimensions, how those selections are reconciled across
> multiple datasets, how the available values are constrained by the SDMX API,
> how all state is persisted in the conversation, and how the resulting data is
> rendered as grids and charts.

---

## Mental Model

The application lets a user query one or more statistical datasets (SDMX dataflows)
and see the results as charts or tables. Each dataset has its own set of dimensions
— think "axes" of the data: Country, Frequency, Time Period, and various indicator
dimensions. Users filter along those axes to narrow down what they want to see.

When a single dataset is active, this is straightforward: the user picks values
from each dimension and a query is built. The complexity begins when **multiple
datasets** are active at the same time. Dataset A might have a dimension called
`REF_AREA` while Dataset B calls the same concept `GEO`. Both represent
"Country/Region", but they use different dimension IDs and different code values
(`FRA` vs `FR`). The system must present a **single shared Country picker** to the
user while keeping track of which code in each dataset corresponds to the selected
value.

This is solved by the **shared filter** layer: three "universal" filters (Country,
Frequency, Time Period) are recognised across datasets by their _semantic subtype_
from deployment metadata, merged into one UI control, and then expanded back to
dataset-specific filters when a query is built.

The shape of data that can actually be returned by each dataset is further narrowed
by fetching **SDMX constraints** — server-side lists of which dimension-value
combinations actually exist in the data. These constraints drive which checkboxes
are enabled, and they are cached by a normalised request key to avoid redundant
round-trips.

All filter state (which values are selected, what time range is chosen) is
serialised into a **system message** appended to the conversation history. This
means filter state survives page reloads and can be replayed when an existing
conversation is reopened.

---

## Glossary

| Term | Meaning |
|---|---|
| **DataQuery** | Core persistence unit. One per dataset: URN + metadata + `QueryFilter[]`. Stored in the system message. |
| **QueryFilter** | A single dimension selection within a DataQuery. Has `componentCode` (dimension ID), `operator` (`in` / `between` / `excluded`), and `values[]`. |
| **Filter** | UI-layer representation of a dimension. Union of `DatasetFilter` and `SharedFilter`. Lives in React state, not in the system message. |
| **DatasetFilter** | A `Filter` tied to one dataset URN and one dimension ID. |
| **SharedFilter** | A `Filter` that spans multiple datasets (Country, Frequency, or Time Period). Holds merged values and a `sourceFilterIdsByDataset` map for re-expansion. |
| **FilterValue** | One selectable item within a Filter. Carries `id`, `name`, `isSelectedValue`, and — for shared filters — a `sourceValues[]` list that records which dataset-native code this represents in each dataset. |
| **Dimension** | SDMX structural metadata describing one axis of a dataset. Has an `id`, a `type` (regular vs. time), and a reference to a codelist. |
| **DatasetDimensionsMetadataMap** | Deployment-time config (from the server) that tags each dimension in each dataset with a `dimensionType` (`INDICATOR`, `NON_INDICATOR`, `TIME_PERIOD`) and optional `subtype` (`REGION`, `FREQUENCY`). Used to recognise which dimensions are "the country one" or "the frequency one" regardless of their actual ID. |
| **DatasetDimensionsScheme** | Per-dataset summary: `{ timePeriod, frequency, region, indicators[], other[] }` — the actual dimension IDs bucketed by role. |
| **DataConstraints** | SDMX constraint response: which values actually exist for each dimension, optionally for a given filter combination. Limits which checkboxes are enabled. |
| **CubeRegion** | SDMX concept inside a constraint. An `isIncluded` flag + `MemberSelection[]` per dimension. |
| **StructureDataMaps** | Aggregated in-memory maps (dimensions, structures, constraints, data messages) for all active datasets. The central "working state" during attachment rendering. |
| **System message** | A `Role.System` message appended to the conversation. Its `custom_content.attachments` holds one JSON-serialised `DataQuery` per active dataset. |

---

## A note on line numbers

Line numbers cited in specs (e.g. `multiple-filters.ts:295`) are approximate starting
points — use the function or symbol name to navigate, not the number. Refactors move
lines; names are greppable. Update numbers when convenient, but do not block a spec
update because you cannot verify every line number.

---

## Spec Files

| File | What it covers |
|---|---|
| [01-domain-model.md](./01-domain-model.md) | Core types — DataQuery, Filter, Dimension, Constraint — and how they relate |
| [02-single-dataset-filters.md](./02-single-dataset-filters.md) | Filter construction, preselection from saved state, and serialisation for one dataset |
| [03-shared-filters-merging.md](./03-shared-filters-merging.md) | How Country/Frequency/Time Period filters are merged across datasets and expanded back |
| [04-constraints-fetching.md](./04-constraints-fetching.md) | When constraints are fetched, what they exclude from requests, caching and normalisation |
| [05-system-message-persistence.md](./05-system-message-persistence.md) | How filter state survives across messages — write path and read (restore) path |
| [06-cross-dataset-grid.md](./06-cross-dataset-grid.md) | Row concatenation, per-row dataset dispatch, value-getter pattern, and view modes for multi-dataset grids |
| [07-data-flow.md](./07-data-flow.md) | Three end-to-end sequences (cold open, filter change, reload) — async ordering and state lifetime |
| [08-python-attachment.md](./08-python-attachment.md) | Python code generation on filter change — dual attachment output, stale request protection, hidden filter preservation |
| [09-applied-filters-display.md](./09-applied-filters-display.md) | How changed filters appear in the chat view — structural hydration and shared vs per-dataset rendering |
| [10-chart-attachments.md](./10-chart-attachments.md) | Lazy resolver, unit splitting by dimension uniqueness, series grouping, and filter-driven chart rebuild |
| [99-gotchas.md](./99-gotchas.md) | Sharp edges and non-obvious behaviours across the filter system |

---

## Key Source Files (quick reference)

| Path | Purpose |
|---|---|
| `libs/shared-toolkit/src/models/data-query.ts` | `DataQuery`, `QueryFilter` types |
| `libs/conversation-view/src/models/filters.ts` | `Filter`, `SharedFilter`, `FilterValue` types |
| `libs/sdmx-toolkit/src/models/structural-metadata/constraints.ts` | `DataConstraints`, `CubeRegion` types |
| `libs/sdmx-toolkit/src/models/datasets-metadata.ts` | `DatasetDimensionsMetadataMap`, `DimensionConfig`, `DatasetLastUpdatedMap` |
| `libs/sdmx-toolkit/src/models/dataset-dimensions-scheme.ts` | `DatasetDimensionsScheme` |
| `libs/conversation-view/src/utils/filters.ts` | Single-dataset filter utilities |
| `libs/conversation-view/src/utils/multiple-filters.ts` | Multi-dataset merging, constraint fetching (1500+ lines — the core) |
| `libs/conversation-view/src/utils/query-filters.ts` | Filter → QueryFilter serialisation |
| `libs/conversation-view/src/utils/system-message.ts` | System message write path |
| `libs/conversation-view/src/utils/normalize-constraint-filters.ts` | Constraint request cache key normalisation |
| `libs/conversation-view/src/utils/attachments/python-attachment.ts` | Python code generation and dual attachment output |
| `libs/conversation-view/src/utils/attachments/replace-python-attachment.ts` | Replacing stored Python code on the system message |
| `libs/conversation-view/src/utils/attachments-details.ts` | Applied filters display — diff, hydration, fusion |
| `libs/conversation-view/src/utils/attachments/charting/chart-data.ts` | Single-dataset chart builder and lazy resolver |
| `libs/conversation-view/src/utils/attachments/charting/cross-dataset-chart-data.ts` | Cross-dataset chart builder |
| `libs/conversation-view/src/utils/attachments/charting/data-uniqueness.ts` | Dimension uniqueness analysis for unit splitting |
| `libs/conversation-view/src/utils/attachments/charting/split-for-units.ts` | Row grouping into `ChartUnit[]` |
| `libs/conversation-view/src/utils/attachments/charting/chart-config-building.ts` | ECharts option assembly |
| `libs/conversation-view/src/models/charting.ts` | `ChartingData`, `ChartUnit`, `ChartUnitGroup` types |
