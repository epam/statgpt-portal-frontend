'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { AdvancedViewSidePanel } from './AdvancedViewSidePanel';

export type AdvancedViewSidePanelConfig = {
  id: string;
  title?: ReactNode;
  headerExtension?: ReactNode;
  content: ReactNode;
  bodyClassName?: string;
  panelClassName?: string;
};

type AdvancedViewSidePanelContextValue = {
  panel: AdvancedViewSidePanelConfig | null;
  openPanel: (panel: AdvancedViewSidePanelConfig) => void;
  closePanel: () => void;
  isPanelOpen: (id?: string) => boolean;
};

const AdvancedViewSidePanelContext =
  createContext<AdvancedViewSidePanelContextValue | null>(null);

export function AdvancedViewSidePanelProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [panel, setPanel] = useState<AdvancedViewSidePanelConfig | null>(null);

  const openPanel = useCallback((newPanel: AdvancedViewSidePanelConfig) => {
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

  const value = useMemo<AdvancedViewSidePanelContextValue>(
    () => ({
      panel,
      openPanel,
      closePanel,
      isPanelOpen,
    }),
    [panel, openPanel, closePanel, isPanelOpen],
  );

  return (
    <AdvancedViewSidePanelContext.Provider value={value}>
      {children}
    </AdvancedViewSidePanelContext.Provider>
  );
}

function useAdvancedViewSidePanelContext() {
  const ctx = useContext(AdvancedViewSidePanelContext);
  if (!ctx) {
    throw new Error(
      'useAdvancedViewSidePanel must be used within AdvancedViewSidePanelProvider',
    );
  }
  return ctx;
}

export function useAdvancedViewSidePanel() {
  const { openPanel, closePanel, isPanelOpen } =
    useAdvancedViewSidePanelContext();

  return {
    openPanel,
    closePanel,
    isPanelOpen,
  };
}

export function AdvancedViewSidePanelOutlet() {
  const { panel, closePanel } = useAdvancedViewSidePanelContext();

  if (!panel) {
    return null;
  }

  return (
    <AdvancedViewSidePanel
      title={panel.title}
      headerExtension={panel.headerExtension}
      onClose={closePanel}
      bodyClassName={panel.bodyClassName}
      panelClassName={panel.panelClassName}
    >
      {panel.content}
    </AdvancedViewSidePanel>
  );
}
