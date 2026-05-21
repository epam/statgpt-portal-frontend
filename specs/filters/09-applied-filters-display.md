# Applied Filters Display

After the user applies a filter change, the chat view renders a summary beneath the
system message showing which filters changed and what they were set to. This is the
"what the user sees" layer — the display pipeline that turns raw `QueryFilter[]`
stored in the system message into localized, human-readable filter chips.

Key files:
- `libs/conversation-view/src/components/ChatMessages/Message/Message.tsx`
- `libs/conversation-view/src/utils/attachments-details.ts`
- `libs/conversation-view/src/components/Attachments/AttachmentDetails/AttachmentDetails.tsx`
- `libs/conversation-view/src/components/Attachments/AttachmentDetails/AttachmentDetailsItem.tsx`

---

## Where the Display Appears

The filter summary is rendered only for messages where `message.role === Role.System`
and a `previousMessage` exists. It does not render:

- On user or assistant messages
- On system messages that have no preceding message (first message in a conversation)
- When the conversation is in AdvancedView mode (`isOpenedAdvancedView` flag) — the
  summary is hidden there since the full filter panel is open

`Message.tsx` passes the system message and its predecessor to `getAttachmentInfoList()`,
which does the comparison and returns `AttachmentInfo[]` for rendering.

---

## What Is Compared

The comparison is between the **previous message's DataQuery** and the **current
system message's DataQuery**. Both are parsed from their respective `custom_content.attachments`
via the same `getDataQueries()` path described in `05-system-message-persistence.md`.

```
previousMessage.attachments → DataQuery[]   (what filters looked like before the change)
systemMessage.attachments   → DataQuery[]   (what filters look like after the change)
```

`getAttachmentInfoList()` in `attachments-details.ts` iterates the current
DataQuery array and for each dataset looks up the corresponding previous DataQuery
by URN. `getUpdatedQueryFiltersDetails()` then compares the two filter lists
to find only the dimensions that changed:

- A filter is considered **changed** if its value set differs from the previous set.
  Comparison uses `isEqual()` on sorted `values` arrays — order of selection does
  not matter.
- Filters absent from the previous DataQuery (new selections) are treated as
  changed.
- Filters absent from the current DataQuery (cleared selections) are treated as
  changed — the cleared state is still shown.
- Filters identical in both are excluded from the summary entirely.

The result is a list of only the dimensions the user actually touched in this filter
session.

---

## Structural Hydration

Raw `QueryFilter[]` contains component codes and value ID arrays (e.g.
`componentCode: "REF_AREA"`, `values: ["FRA", "DEU"]`). These must be resolved to
human-readable strings for display.

`getQueryFiltersDetails()` in `attachments-details.ts` performs this hydration for
each changed filter. It requires `datasetStructuresMap` — a map from dataset URN to
the full SDMX structural response — to be populated before it runs.

For each `QueryFilter`:

1. **Dimension title** — the `componentCode` is looked up in the dataset's
   `Dimension[]` to find the associated concept. The concept's localised `name` in
   the current locale becomes the filter's display title. Falls back to the
   `componentCode` ID if the concept is not found.

2. **Value labels** — for `operator: 'in'`, each value ID is looked up in the
   codelist associated with that dimension. The localised `name` of the matching
   code becomes the display label. Falls back to the raw ID.

3. **Time range** — for `operator: 'between'`, the two date strings are passed
   through `getTimePeriod()` and formatted with `getDateString()` to produce a
   locale-aware range label (e.g. `"Jan 2020 – Dec 2023"`).

4. **Excluded** — for `operator: 'excluded'`, a fixed label is shown (no values to
   resolve).

5. **Shared filter ID resolution** — `getSharedFilterIdForDatasetDimension()` checks
   whether this dimension maps to one of the three shared filter IDs (`COUNTRY`,
   `FREQUENCY`, `TIME_PERIOD`). If it does, the `AttachmentInfo` entry is tagged
   with the shared filter ID so the renderer can group it correctly.

---

## Data Model

```ts
// models/attachments.ts
interface AttachmentInfo {
  datasetName?: string;
  queryFiltersDetails?: QueryFilterDetails[];
}

// QueryFilterDetails (from @epam/statgpt-shared-toolkit)
interface QueryFilterDetails {
  id: string;          // dimension ID or shared filter ID
  title: string;       // localized dimension name
  valuesTitles: string[];  // localized value names (or formatted date range)
}
```

`getAttachmentInfoList()` returns `AttachmentInfo[]` — one entry per dataset that
has at least one changed filter.

---

## Shared vs Per-Dataset Rendering

`AttachmentDetails.tsx` splits the `AttachmentInfo[]` into two groups before
rendering:

- **Shared filters** (`sharedFilterDetails`): entries whose `id` is in
  `SHARED_FILTER_IDS` (`COUNTRY`, `FREQUENCY`, `TIME_PERIOD`). These represent
  dimensions that are shown as a single merged picker in the UI and should be
  displayed once at the top of the summary, not repeated per dataset.

- **Per-dataset filters** (`perDatasetInfoList`): entries that belong to a specific
  dataset — dataset-specific dimensions not shared across datasets.

The render order is: shared filters first (no dataset name prefix), then per-dataset
filters (each preceded by an optional dataset icon and name).

In **single-dataset mode** there are no shared filters — all entries are per-dataset
and the dataset name header is typically omitted. The mode switch is a runtime check
on whether `sharedFilterDetails` has any entries.

---

## Cross-Dataset Filter Fusion

When multiple datasets contribute to the same shared filter (e.g. both Dataset A's
`REF_AREA` and Dataset B's `GEO` map to `COUNTRY`), `getAttachmentInfoList()` merges
their changed values into a single `AttachmentInfo` entry. It does not produce two
separate "Country changed in Dataset A" and "Country changed in Dataset B" entries.

The fusion uses the value labels (not the native code IDs) as the merge key — the
same name-based matching described in `03-shared-filters-merging.md`. If Dataset A's
`FRA` and Dataset B's `FR` both resolve to the label `"France"`, the fused entry
shows `"France"` once. If the labels differ, they appear as separate entries in the
fused list.

This means the user sees "Country set to France, Germany" rather than "Dataset A:
France, Germany / Dataset B: France, Germany", consistent with the merged picker
they used to make the selection.

---

## Rendering

`AttachmentDetailsItem.tsx` renders one filter as:

> **"{Title}"** set to **"{Value1}, {Value2}, ..."**

For time range:

> **"Time Period"** set to **"Jan 2020 – Dec 2023"**

Multiple values are joined with `", "`. The component receives a `QueryFilterDetails`
object and has no knowledge of datasets or shared/per-dataset logic — that split
happens in `AttachmentDetails.tsx` before it reaches here.

---

## Data Dependencies and Ordering

`getAttachmentInfoList()` requires:
- `datasetStructuresMap` populated (for codelist and concept lookup)
- `DatasetDimensionsMetadataMap` available from context (for shared filter ID resolution)
- Both the system message and its preceding message present in the rendered message
  list

If `datasetStructuresMap` is empty or the target dataset's structures haven't loaded,
dimension titles and value labels degrade to their raw IDs. There is no loading state
— the summary renders with whatever data is available at render time.

The previous-message dependency means the filter summary is inherently tied to the
message pair pattern: system message immediately following an assistant message. If
the previous message is a user message (unusual but possible), the diff compares
against that message's attachments, which typically have no `DataQuery` — the result
is all filters shown as "new" rather than "changed."

---

## Invariants

- Only changed filters appear. Unchanged dimensions are omitted regardless of how
  many selections they have.
- The summary reads from the **previous message's** DataQuery for the before-state,
  not from any React state. This makes it purely derived from the stored conversation
  and stable across reloads.
- Shared filter entries in the display do not carry a `datasetUrn`. They are
  assembled from the matching entries across all datasets and tagged by shared filter
  ID only.
- The display layer never modifies filter state. It is read-only with respect to
  `DataQuery`, `Filter[]`, and `QueryFilter[]`.
- If `replacePythonAttachment` failed to persist (see spec 08) and the system
  message has no attachments, both DataQuery arrays are empty and the summary renders
  nothing.
