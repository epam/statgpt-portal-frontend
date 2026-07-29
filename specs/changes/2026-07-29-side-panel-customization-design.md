# Side Panel Customization — Design

**Date:** 2026-07-29
**Status:** Approved, not yet implemented

---

## Problem

The conversation-view side panel (`ConversationViewSidePanel` / `ConversationViewSidePanelContext`, in `libs/conversation-view/src/components/ConversationView/SidePanel/`) and the metadata dataset details it renders (`DatasetInfoDetails.tsx`, same folder tree) are fully closed for extension today:

- The panel's close button is hardcoded to a `<button><IconX/></button>` — no way to swap it for a different icon, label, or component.
- The panel's width/spacing is only overridable via `panelClassName`/`headerClassName`/`bodyClassName` props passed at the `openPanel()` call site — but those call sites (`DatasetDetailCellRenderer`, `MetadataCellRenderer`, `MergedDimensionCellRenderer`, `ObservationValueCellWithMetadata`, `AdvancedAttachmentRenderer`, `DatasetInfo.tsx`) all live *inside* `conversation-view` itself. A consuming app has no way to reach them to pass different props.
- `DatasetInfoDetails.tsx` hardcodes the dataset row's leading icon (`IconDatabase`) and the entire external-link element (`<a target="_blank" rel="noopener noreferrer"><IconExternalLink/></a>`). Some consumers need a different dataset icon, and need full control over the external-link element itself — up to and including guaranteeing no new tab ever opens, which a native `<a target="_blank">` cannot do: middle-click, Ctrl/Cmd-click, and the browser's own "open link in new tab" context-menu entry all bypass any `onClick` handler and act on `href`/`target` directly.

Since the internal call sites can't be reached, the only way to let a consuming app customize any of this without forking `conversation-view` is a provider-based override that those internal components read from, at render time — the same shape already established by `InlineAlertProvider`.

## Approach

Two new, independent contexts, following the exact `InlineAlertProvider`/`useInlineAlertConfig()` precedent (`libs/ui-components/src/components/InlineAlert/InlineAlertContext.tsx`):

- **`SidePanelCustomizationProvider` / `useSidePanelCustomizationConfig()`** — panel chrome only (close control, panel/header/body classes). Consumed by `ConversationViewSidePanel`. Named distinctly from the existing `ConversationViewSidePanelProvider` (which manages *which panel is open*, an unrelated concern) to avoid confusion between the two.
- **`DatasetInfoDetailsProvider` / `useDatasetInfoDetailsConfig()`** — the dataset icon and the external-link element, both rendered by `DatasetInfoDetails`.

Kept as two separate contexts rather than one: `DatasetInfoDetails` renders no panel chrome at all (no close button, no panel width), so coupling it to a context named for the panel would be a naming/responsibility mismatch. Its own two customizable elements (dataset icon, external-link element) are bundled into one config scoped to that component, rather than one context per icon, since both live in the same row of the same component.

Both `closeControl` and `externalLink` follow the same **full component-replacement** shape rather than narrower icon/handler props: the consumer's component owns the entire rendered element, not just a prop layered onto library-owned markup. This was chosen over an icon-swap-plus-`onClick`-intercept approach specifically because the latter cannot fully suppress a native anchor's new-tab behavior (see Problem above) — only owning the element outright can guarantee that.

Both contexts are **fully optional** at every level. With no provider mounted, `useContext` returns `null`, every read is optional-chained, and both components fall back to their exact current hardcoded behavior. This is purely additive — no changes required in any consuming app unless it chooses to opt in.

## Config shapes

```ts
// libs/conversation-view/src/components/ConversationView/SidePanel/SidePanelCustomizationContext.tsx
export interface SidePanelCustomizationConfig {
  closeControl?: React.ComponentType<{ onClose: () => void }>;
  classes?: {
    panel?: string;
    header?: string;
    body?: string;
  };
}

export const SidePanelCustomizationContext = createContext<SidePanelCustomizationConfig | null>(null);
export const SidePanelCustomizationProvider = ({
  value,
  children,
}: {
  value?: SidePanelCustomizationConfig;
  children: ReactNode;
}) => (
  <SidePanelCustomizationContext.Provider value={useMemo(() => value ?? {}, [value])}>
    {children}
  </SidePanelCustomizationContext.Provider>
);
export const useSidePanelCustomizationConfig = () => useContext(SidePanelCustomizationContext);
```

```ts
// libs/conversation-view/src/components/AdvancedView/Metadata/SidePanel/DatasetInfoDetailsContext.tsx
export interface DatasetInfoDetailsConfig {
  icon?: React.ReactNode; // dataset row's leading icon, default IconDatabase
  externalLink?: React.ComponentType<{ url: string }>; // replaces the default <a target="_blank"> entirely
}

export const DatasetInfoDetailsContext = createContext<DatasetInfoDetailsConfig | null>(null);
export const DatasetInfoDetailsProvider = ({
  value,
  children,
}: {
  value?: DatasetInfoDetailsConfig;
  children: ReactNode;
}) => (
  <DatasetInfoDetailsContext.Provider value={useMemo(() => value ?? {}, [value])}>
    {children}
  </DatasetInfoDetailsContext.Provider>
);
export const useDatasetInfoDetailsConfig = () => useContext(DatasetInfoDetailsContext);
```

## Component wiring

**`ConversationViewSidePanel.tsx`** — resolves `closeControl` from `useSidePanelCustomizationConfig()`:

```tsx
const config = useSidePanelCustomizationConfig();
const CloseControl = config?.closeControl;

{CloseControl ? (
  <CloseControl onClose={onClose} />
) : (
  <button type="button" onClick={onClose}>
    <IconX className="size-5 text-neutrals-1000" />
  </button>
)}
```

`config?.classes?.panel/header/body` merge into the existing `panelClassName`/`headerClassName`/`bodyClassName` props via the existing `mergeClasses` util, at a new middle precedence tier: component default classes < provider `classes.*` < per-call prop. `mergeClasses` (tailwind-merge based) already dedupes conflicting utilities correctly, so this requires no new merge logic — just one more argument in the existing `mergeClasses(...)` calls.

**`DatasetInfoDetails.tsx`** — resolves the dataset icon and the external-link component from `useDatasetInfoDetailsConfig()`:

```tsx
const config = useDatasetInfoDetailsConfig();
const DatasetIcon = config?.icon ?? <IconDatabase className="size-4 text-neutrals-700" />;
const ExternalLink = config?.externalLink;

{DatasetIcon}
...
{ExternalLink ? (
  <ExternalLink url={url} />
) : (
  <a href={url} target="_blank" rel="noopener noreferrer">
    <IconExternalLink className="size-4 shrink-0 cursor-pointer text-primary" />
  </a>
)}
```

With no override, behavior is byte-identical to today. With an override, the consumer's component receives only `url` and owns the entire element — icon, wrapper (`<button>`, a differently-configured `<a>`, anything), and click handling. A consumer that renders a `<button>` with no `href` guarantees no new tab can open through any native mechanism (middle-click, Ctrl/Cmd-click, right-click context menu), since none of those act on a plain button.

**Exports** — add `SidePanelCustomizationProvider`, `useSidePanelCustomizationConfig`, `SidePanelCustomizationConfig`, `DatasetInfoDetailsProvider`, `useDatasetInfoDetailsConfig`, `DatasetInfoDetailsConfig` to `libs/conversation-view/src/index.ts`, alongside the existing `ConversationViewSidePanelOutlet` exports.

**Scope note**: the external-link anchor pattern is currently duplicated in three places (`DatasetInfoDetails.tsx`, `DatasetInfo.tsx`'s non-panel dataset header, `ChatMessages.tsx`), and `DatasetInfo.tsx` also renders its own `IconDatabase`-style dataset icon. This design scopes `DatasetInfoDetailsProvider` consumption to `DatasetInfoDetails.tsx` only, matching the reported problem. The other duplicated icon/anchor in `DatasetInfo.tsx` and `ChatMessages.tsx` are left as-is — out of scope for this change.

## Testing

Following `InlineAlert.spec.tsx` conventions (`libs/ui-components/src/components/InlineAlert/InlineAlert.spec.tsx`):

- **`SidePanelCustomizationContext.spec.tsx`** / **`DatasetInfoDetailsContext.spec.tsx`** — hook returns `null` outside a provider; returns the supplied `value` inside one.
- **`ConversationViewSidePanel.spec.tsx`** (extend existing) — default `IconX` button + `onClose` call with no provider; custom `closeControl` rendered and its `onClose` invoked when provider supplies one; provider `classes.panel` merges correctly under an existing `panelClassName` prop (prop wins).
- **`DatasetInfoDetails.spec.tsx`** (extend existing, or add if none exist) — default `IconDatabase` dataset icon and default `IconExternalLink` + native `target="_blank"` anchor with no provider; custom dataset icon rendered when provided; custom `externalLink` component rendered with the correct `url` prop instead of the default anchor when provided.

Existing specs for both components must continue passing unmodified — the no-provider path is untouched.

## Backward compatibility

Zero required changes in any consuming app. Purely additive: a consuming app opts in by wrapping `SidePanelCustomizationProvider` and/or `DatasetInfoDetailsProvider` (independently) around its tree — most naturally alongside the existing `InlineAlertProvider` in its own `ComponentsConfig.tsx` — and supplying only the config keys it needs; everything else keeps today's default behavior.
