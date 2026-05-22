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

`replace-python-attachment.ts`. Takes the current message list and the new markdown
attachment. Locates the target message with the following priority:

1. If a `messageId` is provided (AdvancedView path): find the message with that ID
2. Otherwise: backward scan from the end of the message list to find the most recent
   `Role.System` message

Once the target is found:
- All existing `type === 'text/markdown'` attachments whose `data` contains
  ` ```python` are removed from the target message
- The new markdown attachment is appended to the remaining attachments
- The updated messages array is returned (or `null` if the target was not found)

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

`invokePythonAttachment` passes `dataQueries` to the Python API without transformation
with respect to the `disabled` flag — the flag is included in the payload automatically
if it is set. The caller (`onApply` in `MultiDatasetFilters`) supplies the updated
`dataQueries` with `disabled` flags already set before calling `invokePythonAttachment`.

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
