# Python Attachment

When the user changes filters, the app re-invokes the LLM's Python code generation
to produce an updated data-fetch script reflecting the new selections. The result
is stored as a special attachment on the conversation's system message so that
refreshing the page re-renders the same code.

All logic lives in:
- `libs/conversation-view/src/utils/attachments/python-attachment.ts`
- `libs/conversation-view/src/utils/attachments/replace-python-attachment.ts`
- `libs/conversation-view/src/utils/query-filters.ts` (`buildDataQueryWithMergedFilters`)
- `libs/conversation-view/src/context/AttachmentsData.tsx` (single-dataset trigger)
- `libs/conversation-view/src/context/AttachmentsDataMultipleQueries.tsx` (multi-dataset trigger)

---

## When It Is Invoked

Both `AttachmentsData` and `AttachmentsDataMultipleQueries` expose an
`onFiltersChange` / `onMultipleDataFiltersChange` callback to the filter components.
When the user clicks Apply in the filter modal, that callback fires. Inside it,
alongside the system-message update described in `05-system-message-persistence.md`,
the context calls `invokePythonAttachment()`.

There is no debounce — every Apply click fires a new request. Stale-request
protection (see below) handles rapid successive changes.

---

## Filter Merge: `buildDataQueryWithMergedFilters()`

`query-filters.ts:160`. Before invoking the Python backend, each `DataQuery` is
rebuilt by merging the UI's current selections into the stored query:

1. **UI-controlled dimensions** — calls `buildQueryFiltersForPythonAttachment()`
   which serialises `timeRange` as ISO `YYYY-MM-DD` (not `MM-DD-YYYY` as used for
   the SDMX data API — see spec 99). Non-time selections become
   `{ operator: 'in', values: [selectedIds...] }`.

2. **Wildcard insertion** — for any UI-controlled dimension that ends up with no
   selection after step 1, a `{ operator: 'in', values: ['*'] }` filter is added.
   This explicitly tells the Python backend "all values" rather than relying on
   filter absence.

3. **Hidden filter preservation** — `QueryFilter` entries whose `componentCode` is
   not in the UI-controlled set are copied through unchanged. These are filters the
   LLM wrote into the `DataQuery` that the user never touched.

The returned `DataQuery[]` is what gets sent to the Python API.

**Dataset-URN scoping (`scopeToDatasetUrn`).** `buildDataQueryWithMergedFilters` takes a
third argument controlling how UI filters are resolved to the dataset:

- **Cross-dataset mode** keeps the default `true`. UI filters carry a `datasetUrn` (and
  shared filters span datasets), so the merge resolves them per dataset via
  `getFiltersForQueryContext(filters, dataQuery.urn)` → `buildFiltersMap`.
- **Single-dataset mode** passes `false`. Single-dataset filters are built by
  `getDatasetFilters` **without** a `datasetUrn`, so they are untagged. Scoping them by
  URN routes through `buildFiltersMap`, which groups by `filter.datasetUrn || ''` and
  then fails to find them under the real URN — silently dropping the entire UI
  selection and falling back to the original stored `DataQuery.filters`. Passing
  `false` makes the merge use the no-URN context (`getFiltersForQueryContext(filters,
  undefined)`), exactly mirroring the grid's `getQueryFilters(filters, dimensions)`
  call, so the user's selection reaches the Python API.

---

## API Call and Dual Attachment Output

`invokePythonAttachment()` in `python-attachment.ts`:

1. Calls `getPythonAttachment(dataQueries)` — an async action that hits the backend
   and returns `{ python_code: string }`.

2. Produces **two attachments** from the single response:

   | Attachment | Type | Purpose |
   |---|---|---|
   | `CUSTOM_CODE_SAMPLE` | UI only | Rendered in the in-chat code editor with `language: 'python'` |
   | Markdown codeblock | Persisted | `` ```python\n${result.python_code}\n``` `` stored on the system message |

   `setCodeAttachments()` updates the UI attachment in React state immediately.
   `onCodeAttachmentUpdated()` callback delivers the markdown attachment to
   `ConversationView`, which calls `replacePythonAttachment()` to write it into the
   message list and then `updateConversation()` to persist to the backend.

---

## Stale-Request Protection

`invokePythonAttachment` takes a `requestIdRef` — a `useRef<number>` counter
managed by the caller. The current value is captured at call time into
`currentRequestId`. The counter is incremented immediately. When the response
arrives, if `requestIdRef.current !== currentRequestId` the response is discarded
without updating state.

This means only the most recently initiated request takes effect. Earlier in-flight
responses are silently dropped. No cancellation of the HTTP request itself occurs;
the network call completes but its result is ignored.

---

## Persistence: `replacePythonAttachment()`

`replace-python-attachment.ts`. Takes the current message list, the new markdown
attachment, an optional `messageId`, and an optional `datasetUrn`. Locates the target
message with the following priority:

1. If a `messageId` is provided (in-chat code-edit path): find the message with that ID
2. Otherwise: backward scan from the end of the message list to find the most recent
   `Role.System` message

Once the target is found:
- If `datasetUrn` is provided (single-dataset filter path): only the
  `type === 'text/markdown'` python attachment whose `title` includes that URN is
  removed; every other dataset's python attachment is preserved.
- If `datasetUrn` is omitted (cross-dataset filter path and in-chat code-edit path):
  all `type === 'text/markdown'` attachments whose `data` contains ` ```python` are
  removed (there is only one combined python attachment in cross-dataset mode).
- The new markdown attachment is appended to the remaining attachments.
- The updated messages array is returned (or `null` if the target was not found). When
  `datasetUrn` is provided but no existing attachment matches it, the new attachment is
  simply appended — siblings are never destroyed.

The backward scan for the fallback case is the same logic described in
`05-system-message-persistence.md` (Invariants). If no system message exists in the
array, the function returns `null` and the python code is not persisted.

---

## Single vs Multi-Dataset

Both `AttachmentsData.tsx` and `AttachmentsDataMultipleQueries.tsx` implement the
same pattern independently. The multi-dataset variant passes a `DataQuery[]` (one
per active dataset) to `buildDataQueryWithMergedFilters` for each dataset, then
collects the rebuilt queries into an array before calling `invokePythonAttachment`.
The API call itself is identical; the difference is only how many `DataQuery` objects
are merged and passed.

**Per-dataset keying in single-dataset (multi-tab) mode.** When more than one dataset
is present and cross-dataset mode is off, each dataset tab has its own python markdown
attachment, keyed by the dataset URN embedded in the attachment title (the read path
`buildMarkdownAttachments(rawAttachments, dataQuery.urn, ...)` filters by
`title.includes(urn)`). On a filter Apply, `AttachmentsData.onFiltersChange` therefore:
- scopes the `originalTitle` lookup to the current `dataQuery.urn`, so the regenerated
  attachment keeps the correct dataset's title, and
- passes `datasetUrn: dataQuery.urn` into `invokePythonAttachment`, which forwards it as
  the second argument of `onCodeAttachmentUpdated` so that `replacePythonAttachment`
  replaces only that dataset's attachment and leaves the other tabs' code intact.

The cross-dataset variant (`AttachmentsDataMultipleQueries`) passes **no** `datasetUrn`
— it persists a single combined attachment, so the remove-all behavior is correct.

`invokePythonAttachment` passes `dataQueries` to the Python API without transformation
with respect to the `disabled` flag — the flag is included in the payload automatically
if it is set. The caller (the multi strategy's `runApply` in
`use-multi-filter-strategy.ts`) supplies the updated `dataQueries` with `disabled`
flags already set before calling `invokePythonAttachment`.

---

## Invariants

- The markdown attachment on the system message is the persisted source of truth for
  the Python code. The UI `CUSTOM_CODE_SAMPLE` attachment is ephemeral — it does not
  survive a page reload.
- If `replacePythonAttachment` returns `null` (no system message found), the new
  code is displayed in the UI but not persisted. The user would see the updated code
  but a reload would revert to the previous version.
- Hidden filters (LLM-set, not UI-controlled) are preserved through every filter
  change. They are never visible in the filter modal and cannot be cleared by the
  user via the UI.
- The Python attachment uses ISO dates (`YYYY-MM-DD`). The SDMX data API uses
  `MM-DD-YYYY`. Both come from the same `timeRange` object serialised by different
  functions — see spec 99.
- In single-dataset (multi-tab) mode there is one python attachment per dataset, keyed
  by URN-in-title. Applying a filter on one tab regenerates and replaces only that
  dataset's attachment; the others are preserved. `updateMessagesWithSystemMessage`
  likewise carries forward **all** python attachments when rebuilding the system message
  (see spec 05), not just the first.
