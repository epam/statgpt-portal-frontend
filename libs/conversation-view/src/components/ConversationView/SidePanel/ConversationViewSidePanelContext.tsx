'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ConversationViewSidePanel } from './ConversationViewSidePanel';

export type ConversationViewSidePanelScope =
  | 'conversation'
  | 'advanced'
  | 'any';

export type ConversationViewSidePanelConfig = {
  id: string;
  scope?: ConversationViewSidePanelScope;
  title?: ReactNode;
  headerExtension?: ReactNode;
  headerClassName?: string;
  content: ReactNode;
  bodyClassName?: string;
  panelClassName?: string;
};

type ConversationViewSidePanelContextValue = {
  panel: ConversationViewSidePanelConfig | null;
  openPanel: (panel: ConversationViewSidePanelConfig) => void;
  closePanel: () => void;
  isPanelOpen: (id?: string) => boolean;
};

const ConversationViewSidePanelContext =
  createContext<ConversationViewSidePanelContextValue | null>(null);

/**
 * ConversationViewSidePanelProvider supplies side-panel open/close state to its
 * subtree, enabling any descendant to imperatively show or hide a configured panel.
 *
 * Wrap the conversation view root with this provider so that both
 * `useConversationViewSidePanelOptional` and `ConversationViewSidePanelOutlet`
 * can function correctly. Only one panel configuration is active at a time;
 * opening a new panel replaces any previously open one.
 *
 * @example
 * Basic setup
 * ```tsx
 * <ConversationViewSidePanelProvider>
 *   <ConversationViewSidePanelOutlet scope="conversation" />
 *   <MyConversationLayout />
 * </ConversationViewSidePanelProvider>
 * ```
 *
 * @param children - Subtree that gains access to the side-panel context.
 */
export function ConversationViewSidePanelProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [panel, setPanel] = useState<ConversationViewSidePanelConfig | null>(
    null,
  );

  const openPanel = useCallback((newPanel: ConversationViewSidePanelConfig) => {
    setPanel(newPanel);
  }, []);

  const closePanel = useCallback(() => {
    setPanel(null);
  }, []);

  const isPanelOpen = useCallback(
    (panelId?: string) => {
      if (!panelId) {
        return panel !== null;
      }

      return panel?.id === panelId;
    },
    [panel],
  );

  const value = useMemo<ConversationViewSidePanelContextValue>(
    () => ({
      panel,
      openPanel,
      closePanel,
      isPanelOpen,
    }),
    [panel, openPanel, closePanel, isPanelOpen],
  );

  return (
    <ConversationViewSidePanelContext.Provider value={value}>
      {children}
    </ConversationViewSidePanelContext.Provider>
  );
}

function useConversationViewSidePanelContextOptional() {
  return useContext(ConversationViewSidePanelContext);
}

/**
 * Returns the side-panel control API (openPanel, closePanel, isPanelOpen) when
 * called inside a ConversationViewSidePanelProvider, or null when used outside one.
 */
export function useConversationViewSidePanelOptional() {
  const ctx = useConversationViewSidePanelContextOptional();

  if (!ctx) {
    return null;
  }

  const { openPanel, closePanel, isPanelOpen } = ctx;

  return {
    openPanel,
    closePanel,
    isPanelOpen,
  };
}

/**
 * ConversationViewSidePanelOutlet renders the currently active side panel
 * when its scope matches the outlet's assigned scope, acting as a mount point
 * for dynamically opened panels within a scoped layout region.
 *
 * Place one outlet per layout region (e.g. `"conversation"` and `"advanced"`).
 * A panel whose `scope` is `"any"` will render in whichever outlet is present.
 * If no provider is in the tree, or no panel is open, the outlet renders nothing.
 *
 * @example
 * Dual-outlet layout
 * ```tsx
 * <ConversationViewSidePanelProvider>
 *   <aside>
 *     <ConversationViewSidePanelOutlet scope="conversation" />
 *   </aside>
 *   <section>
 *     <ConversationViewSidePanelOutlet scope="advanced" />
 *   </section>
 * </ConversationViewSidePanelProvider>
 * ```
 *
 * @param scope - Layout region this outlet serves; only panels with a matching
 *   or `"any"` scope are rendered here.
 */
export function ConversationViewSidePanelOutlet({
  scope,
}: {
  scope: 'conversation' | 'advanced';
}) {
  const ctx = useConversationViewSidePanelContextOptional();

  if (!ctx) {
    return null;
  }

  const { panel, closePanel } = ctx;

  if (!panel) {
    return null;
  }

  const panelScope = panel.scope ?? 'any';
  if (panelScope !== 'any' && panelScope !== scope) {
    return null;
  }

  return (
    <ConversationViewSidePanel
      title={panel.title}
      headerExtension={panel.headerExtension}
      headerClassName={panel.headerClassName}
      onClose={closePanel}
      bodyClassName={panel.bodyClassName}
      panelClassName={panel.panelClassName}
    >
      {panel.content}
    </ConversationViewSidePanel>
  );
}
