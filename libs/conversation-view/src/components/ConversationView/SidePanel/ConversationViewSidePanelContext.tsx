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

function useConversationViewSidePanelContext() {
  const ctx = useContext(ConversationViewSidePanelContext);
  if (!ctx) {
    throw new Error(
      'useConversationViewSidePanel must be used within ConversationViewSidePanelProvider',
    );
  }
  return ctx;
}

function useConversationViewSidePanelContextOptional() {
  return useContext(ConversationViewSidePanelContext);
}

export function useConversationViewSidePanel() {
  const { openPanel, closePanel, isPanelOpen } =
    useConversationViewSidePanelContext();

  return {
    openPanel,
    closePanel,
    isPanelOpen,
  };
}

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

export function ConversationViewSidePanelOutlet({
  scope,
}: {
  scope: 'conversation' | 'advanced';
}) {
  const { panel, closePanel } = useConversationViewSidePanelContext();

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
