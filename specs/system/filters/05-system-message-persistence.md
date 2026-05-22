# System Message Persistence

Filter state must survive page reloads and be shareable: if a user sets up filters
and then the page refreshes (or a colleague opens the shared conversation link),
the exact same selections should reappear. This is achieved by persisting filter
state into the conversation history as a special system message.

---

## The Storage Format

Filter state is written as a `Role.System` message at the tail of the message list
at the time of the filter change. It has no visible text content — its payload lives
in `custom_content.attachments`.

One attachment per active dataset, each containing a JSON-serialised `DataQuery`:

```json
{
  "role": "system",
  "content": "",
  "custom_content": {
    "attachments": [
      {
        "type": "application/json",
        "title": "Dataset A title",
        "data": "{\"urn\":\"urn:sdmx:...\",\"metadata\":{...},\"filters\":[...]}"
      },
      {
        "type": "application/json",
        "title": "Dataset B title",
        "data": "..."
      }
    ],
    "form_schema": { ... }
  }
}
```

The `form_schema` field is carried forward from the last assistant message found
in the array — it holds any form/button configuration the LLM produced and must
not be lost when the system message is rewritten.

---

## Write Path

### `prepareSystemMessage()`

`libs/conversation-view/src/utils/system-message.ts:6`

Builds a fresh system `Message` from the current `DataQuery[]` and filter state.

Accepts two alternative ways to supply per-dataset filters:

| Mode | When used |
|---|---|
| `queryFiltersMap: Map<urn, QueryFilter[]>` | Multi-dataset: each dataset has its own filter list |
| `filters + currentDataQuery` | Single-dataset: one filter list applied to the matching DataQuery |

For each `DataQuery` in `dataQueries`, the filter selection is resolved as follows:

- **Multi-dataset** (`queryFiltersMap` provided): `queryFiltersMap.get(dataQuery.urn)`
- **Single-dataset**: `filters` if `currentDataQuery.urn === dataQuery.urn`; otherwise
  the existing `dataQuery.filters` — non-targeted datasets keep their saved selections

The resolved filters are serialised as `{ urn, metadata, filters }` and stored in
`attachment.data` as a JSON string. When a dataset has `disabled: true`, the flag is
included in the serialised payload; `disabled` is omitted entirely when the dataset is
enabled (falsy). Existing conversations that lack the field are treated as fully enabled
on restore — no migration is needed.

### `updateMessagesWithSystemMessage()`

`libs/conversation-view/src/utils/system-message.ts:40`

Updates the message list with the freshly built system message:

1. Check if the **last** message has `role === Role.System` — if so, pop it
2. Push the new system message

The pop only fires when the last message is already a system message. If the last
message is a user or assistant message (e.g. after the user sent a follow-up), the
old system message (if any, now mid-array) is left untouched and a second system
message is appended. See the Invariants section.

### When is this called?

Both single-dataset (`Filters.tsx`) and multi-dataset (`MultiDatasetFilters.tsx`)
filter components call `updateMessagesWithSystemMessage` inside their filter-change
callbacks, then call `updateConversation()` with the updated message list. This
triggers an API call that persists the conversation to the backend.

---

## Read Path

### Step 1 — Parsing attachments from a message

`Message.tsx` reads attachments from each rendered message via
`parseMessageAttachments(message)`, then calls `getDataQueries(attachments)` from
`libs/conversation-view/src/utils/attachments/parse-data-query.ts:5`.

`getDataQueries` filters attachments to JSON type, then calls
`getDataQueryFromJson()` on each one's `.data` string.

### Step 2 — `getDataQueryFromJson()`

`parse-data-query.ts:33`. Handles **backward compatibility** with older
conversation formats that used snake_case field names:

| New field | Old fallback |
|---|---|
| `componentCode` | `component_code` |
| `countryDimension` | `country_dimension` |
| `indicatorDimensions` | `indicator_dimensions` |

This means conversations saved months ago still parse correctly even after field
renames.

### Step 3 — Passing DataQuery to the view

The parsed `DataQuery[]` is set into local state as `attachmentsDataQueries` and
passed down to `AdvancedView` and the `Filters` component as props.

Each message is rendered independently, so when multiple system messages exist in
the array they all render. Only the latest one is connected to the active filter UI
(the earlier ones are historical snapshots and no longer drive any live component).

For the system message specifically (`message.role === Role.System`), `Message.tsx`
also reads the **previous message's** attachments (typically the assistant message
that triggered the filter UI) to build `AttachmentInfoList` — a display list showing
which datasets are active and what their filter summaries are.

### Step 4 — Restoring filter selections

Once `DataQuery[]` is available and structural data + constraints have loaded,
`getFiltersPreselectedByDataQuery()` (single-dataset) or
`getFiltersPreselectedByDataQueries()` (multi-dataset) applies the saved
`QueryFilter[]` back onto the freshly-built `Filter[]`.

This is described in detail in `02-single-dataset-filters.md` (section 2) and
`03-shared-filters-merging.md` (Restoring Active Datasets section).

---

## What Is and Is Not Persisted

| Persisted | Not persisted |
|---|---|
| Selected dimension values (`QueryFilter[]`) | Which filter panel is open (`isSelectedFilter`) |
| Selected time range (as `BETWEEN` values) | Display mode (flat list / hierarchy) |
| Dataset URNs and metadata | Hierarchy expansion state |
| `form_schema` from the last assistant message | Constraint responses (re-fetched on load) |
| Dataset title | Disabled/enabled state of values |
| `disabled` flag (when `true`; omitted when falsy) | — |

Filter UI state (which panel is open, how values are displayed) is always reset on
reload. Only the **selections** — which values the user picked — are restored.

---

## Invariants

- **The system message is at the tail only immediately after a filter change.**
  Once the user sends a follow-up chat message, `finalizeConversation` saves
  `[...existingMessages, userMsg, assistantMsg]` — the old system message becomes
  mid-array.

- **Multiple system messages can accumulate.** If the user sets filters, sends a
  chat message, and then changes filters again, `updateMessagesWithSystemMessage`
  finds an assistant message at the end (not a system message), leaves the old
  system message in place, and appends a new one. The conversation can then contain
  two system messages: one embedded mid-array, one at the tail.

- **The latest system message wins on read.** `replace-python-attachment.ts` uses a
  backward scan (`for i = length-1; i >= 0`) to find the most recent system message.
  Earlier ones are stale snapshots.

- Every filter change triggers a full rewrite of the tail system message — partial
  updates do not exist.

- Absence of a system message is valid: it means default filters (no selections).
  The app initialises `Filter[]` with all values unselected in that case.

- The `data` field in each attachment is a JSON string (double-serialised). Parsing
  requires `JSON.parse(attachment.data)`, not direct object access.
