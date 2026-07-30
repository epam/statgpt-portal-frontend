'use client';

import {
  ComponentType,
  createContext,
  ReactNode,
  useContext,
  useMemo,
} from 'react';

export interface SidePanelCustomizationConfig {
  closeControl?: ComponentType<{ onClose: () => void }>;
  classes?: {
    panel?: string;
    header?: string;
    body?: string;
  };
}

const SidePanelCustomizationContext =
  createContext<SidePanelCustomizationConfig | null>(null);

export interface SidePanelCustomizationProviderProps {
  value?: SidePanelCustomizationConfig;
  children: ReactNode;
}

/**
 * SidePanelCustomizationProvider supplies optional overrides for
 * ConversationViewSidePanel's chrome (close control, panel/header/body
 * classes) to its subtree. Distinct from ConversationViewSidePanelProvider,
 * which manages which panel is currently open, not how it's styled.
 *
 * @example
 * ```tsx
 * <SidePanelCustomizationProvider value={{ classes: { panel: 'w-full' } }}>
 *   <MyLayout />
 * </SidePanelCustomizationProvider>
 * ```
 *
 * @param value - Optional customization config; omitted keys fall back to ConversationViewSidePanel's defaults.
 * @param children - Subtree that gains access to the customization config.
 */
export function SidePanelCustomizationProvider({
  value,
  children,
}: SidePanelCustomizationProviderProps) {
  const memo = useMemo(() => value ?? {}, [value]);

  return (
    <SidePanelCustomizationContext.Provider value={memo}>
      {children}
    </SidePanelCustomizationContext.Provider>
  );
}

/**
 * Returns the current SidePanelCustomizationConfig, or null when called
 * outside a SidePanelCustomizationProvider.
 */
export function useSidePanelCustomizationConfig() {
  return useContext(SidePanelCustomizationContext);
}
