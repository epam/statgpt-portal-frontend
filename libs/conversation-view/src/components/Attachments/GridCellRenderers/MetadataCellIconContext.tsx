'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';

export interface MetadataCellIconConfig {
  icon?: ReactNode;
}

const MetadataCellIconContext = createContext<MetadataCellIconConfig | null>(
  null,
);

export interface MetadataCellIconProviderProps {
  value?: MetadataCellIconConfig;
  children: ReactNode;
}

/**
 * MetadataCellIconProvider supplies an optional override for the icon
 * rendered by MetadataCellRenderer's pinned grid column button. The icon is
 * rendered raw (no sizing wrapper) — size it around `size-5` (20px) to fit
 * the pinned 32px column cleanly.
 *
 * @example
 * ```tsx
 * <MetadataCellIconProvider value={{ icon: <MyMetadataIcon className="size-5" /> }}>
 *   <MyLayout />
 * </MetadataCellIconProvider>
 * ```
 *
 * @param value - Optional customization config; omitted keys fall back to MetadataCellRenderer's defaults.
 * @param children - Subtree that gains access to the customization config.
 */
export function MetadataCellIconProvider({
  value,
  children,
}: MetadataCellIconProviderProps) {
  const memo = useMemo(() => value ?? {}, [value]);

  return (
    <MetadataCellIconContext.Provider value={memo}>
      {children}
    </MetadataCellIconContext.Provider>
  );
}

/**
 * Returns the current MetadataCellIconConfig, or null when called outside a
 * MetadataCellIconProvider.
 */
export function useMetadataCellIconConfig() {
  return useContext(MetadataCellIconContext);
}
