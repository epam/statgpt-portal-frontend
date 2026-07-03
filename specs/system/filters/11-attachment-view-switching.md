# Attachment View-Mode Switching

A dataset answer renders its attachments as a set of tabs — **Data** (grid), **Chart**,
and **Code samples** — inside a single `AttachmentRenderer`. The user switches between
them by clicking a tab in `AttachmentsViewModePanel`. This spec covers the two mechanisms
that keep that switch visually stable: **loading-state height reservation** (so the
attachment does not collapse while the new view builds) and the **scroll-position lock**
(so the conversation and the tabs/buttons row stay fixed on screen across the switch).

Key files:
- `libs/conversation-view/src/components/Attachments/AttachmentRenderer.tsx`
- `libs/conversation-view/src/components/Attachments/AttachmentsContentRenderer.tsx`
- `libs/conversation-view/src/components/Attachments/AttachmentsViewModePanel.tsx`
- `libs/conversation-view/src/components/Attachments/useViewModeScrollAnchor.ts`
- `libs/conversation-view/src/components/Attachments/CustomAttachments/CustomChartAttachment.tsx`
- `libs/conversation-view/src/components/Attachments/CustomAttachments/CustomGridAttachment.tsx`
- `libs/conversation-view/src/components/Attachments/CustomAttachments/CrossDatasetGridAttachment.tsx`
- `libs/conversation-view/src/components/Attachments/CustomAttachments/GridContainer.tsx`

---

## Layout

`AttachmentRenderer` stacks the view-mode panel above the content in a **flex column**,
and delegates the selected attachment's rendering to `AttachmentsContentRenderer`, whose
root is a **flex row**:

```
AttachmentRenderer
  <div flex flex-col items-center gap-4>      ← contentColumnRef (scroll anchor)
    <AttachmentsViewModePanel/>               ← tabs + download / advanced-view buttons
    <AttachmentsContentRenderer>
      <div flex min-h-0 w-full flex-1 justify-center>   ← FLEX ROW
        <CustomChartAttachment | CustomDataGridAttachment | … />
```

`selectedAttachmentIndex` is local state in `AttachmentRenderer`; clicking a tab only
re-renders this subtree — it does not touch the conversation `messages` or re-mount
`ChatMessages`.

The flex-row content wrapper is important: it is why loading placeholders need special
care (see below).

---

## Loading-State Height Reservation

The Chart attachment is **lazily built** (see `10-chart-attachments.md`): on selection it
mounts with `isLoading = true`, runs `getChartingData()` inside `scheduleDeferredWork`
(a rAF + `setTimeout(0)`), and only then renders the chart. During that asynchronous
build it must render a placeholder that occupies the **same height** the finished chart
will, otherwise the attachment collapses to the loader's intrinsic height, the document
shrinks, and the conversation jumps.

Each attachment therefore renders its `<Loader/>` inside a height-reserving box:

```tsx
// CustomChartAttachment.tsx
if (isLoading || isDataLoading) {
  return (
    <div className="chart-attachment size-full">
      <div className="flex size-full flex-col gap-4">
        <div className={classNames('flex items-center justify-center', chartHeightClass)}>
          <Loader />
        </div>
      </div>
    </div>
  );
}
```

`chartHeightClass` is the same class the rendered chart uses:

| Mode | Class | Reserved height |
|---|---|---|
| `fillHeight` (advanced view fill) | `flex-1 min-h-0` | fills parent |
| mobile (`isNarrowChart`) | `h-full min-h-[500px]` | ≥ 500px |
| `fixHeight` (conversation view) | `h-full max-h-[400px] min-h-[400px]` | 400px |
| otherwise | `h-full min-h-[300px]` | ≥ 300px |

The two grid attachments follow the identical pattern, with a height class mirroring their
own contract (`CustomGridAttachment` also honours `fillHeight`; `CrossDatasetGridAttachment`
does not):

```tsx
// CustomGridAttachment.tsx / CrossDatasetGridAttachment.tsx
if (isLoading || isDataLoading) {
  return (
    <div className="size-full">
      <div className="flex size-full flex-col">
        <div className={classNames('flex items-center justify-center', heightClass)}>
          <Loader />
        </div>
      </div>
    </div>
  );
}
```

### Why the flex-column wrapper is required

The reserved-height element **must** sit inside a flex **column** so `min-height` is a
**main-axis** size and actually reserves layout space. If it is placed as a direct child
of `AttachmentsContentRenderer`'s flex **row**, `min-height` becomes a **cross-axis**
size: when the row's height is constrained the element simply **overflows** instead of
pushing the layout, and the attachment collapses during loading anyway.

This is exactly why the *rendered* chart holds its height (its `chart-area` `min-h-[400px]`
lives inside `flex size-full flex-col`) while an earlier loader placed directly in the flex
row silently collapsed. The loading placeholder mirrors the rendered structure for this
reason. See `99-gotchas.md` → "min-height only reserves space on the flex main axis".

> The rendered grids reserve height a different way — `GridContainer` sets an explicit
> `style={{ height: gridHeight }}` (capped at `max-h-[400px]` under `fixHeight`), which is
> an explicit height and reserves regardless of flex axis. The **loading** placeholder does
> not know the final row count, so it reserves the fixed cap via the flex-column pattern.

---

## Scroll-Position Lock

Even with no collapse, switching between views of different heights (e.g. a short grid → a
taller chart, or a long code sample → a chart) changes the document height. The browser's
**native scroll anchoring** (`overflow-anchor: auto`) tries to keep the view stable, but it
is a heuristic that only works when there is stable content *below* the resizing element —
it fails for the **last message** (nothing below it to anchor to), jumping the whole
conversation. `useViewModeScrollAnchor` replaces that heuristic with a deterministic lock.

`AttachmentRenderer` wires it up:

```tsx
const contentColumnRef = useRef<HTMLDivElement>(null);
const { captureAnchor } = useViewModeScrollAnchor(
  contentColumnRef,
  !isOpenedAdvancedView, // enabled only in conversation view
);

const selectAttachment = (index: number) => {
  captureAnchor();               // BEFORE the content swaps
  setSelectedAttachmentIndex(index);
};
```

`captureAnchor()` is called **synchronously before** the state change, while the old
content is still mounted, so it reads the pre-switch scroll position.

### Behaviour

The hook locks the scrolling conversation container (`.scroll-hidden-container`) to its
captured `scrollTop` for a short settle window (`SETTLE_MS = 1000`, long enough to outlast
the chart's async build), re-asserting it on every animation frame. From that single rule
the full UX spec falls out:

| Situation on switch | Result |
|---|---|
| New view **taller** or same height | `scrollTop` stays valid → content and tabs/buttons stay exactly put, even while the chart builds. |
| New view **shorter**, user **not** at the bottom | Holding `scrollTop` is still valid → stays put. |
| New view **shorter**, user **at the very bottom** of the taller view | Holding the old `scrollTop` exceeds the new maximum, so the browser **clamps** it — the content settles **down by the height difference**. This is the one allowed movement, and it happens only after the shorter content has rendered. |

The settle-down is not special-cased; it is the natural scroll clamp that occurs only in
the at-the-bottom + shorter case.

### Details

- **Native anchoring is suspended** during the window (`scroller.style.overflowAnchor =
  'none'`) so it does not fight the lock, and restored on stop.
- **A manual scroll aborts the lock** immediately — `wheel` and `touchmove` listeners call
  `stop()`, handing control back to the user. Programmatic `scrollTop` writes fire `scroll`
  (not `wheel`/`touchmove`), so the lock does not cancel itself.
- The window is a fixed duration rather than an early "settled" exit, because the chart
  height changes in several async steps (loader → echarts render) and an early stop could
  land on an intermediate frame.
- **No-op in advanced view** (`enabled = false`) — that layout has no
  `.scroll-hidden-container` conversation scroller.
- Cleanup cancels the rAF, restores `overflow-anchor`, and detaches listeners on unmount or
  when a new `captureAnchor()` supersedes an in-flight lock.

---

## Invariants

- Loading placeholders must keep the reserved-height element inside a flex **column**.
  Moving it to a flex-row parent reintroduces the collapse-and-jump (`min-height` becomes a
  cross-axis size and overflows).
- The loading placeholder height must match the rendered view's height class, so there is
  no second resize when the real content replaces the loader.
- `captureAnchor()` must run **before** `setSelectedAttachmentIndex` — it reads the
  pre-switch `scrollTop`. Calling it after the swap captures the wrong position.
- The scroll lock only holds `scrollTop`; it never scrolls to a new position itself. The
  only downward movement is the browser's own clamp, so growth never forces a scroll and the
  view can only ever settle *down*, never jump up.
- Tab switching is local state in `AttachmentRenderer`; it must not trigger a
  `messages`/`isStreaming` change, or `ChatMessages`' `scrollToBottom` effect would fire and
  override the lock.
