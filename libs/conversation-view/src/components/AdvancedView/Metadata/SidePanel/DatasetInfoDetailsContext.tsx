'use client';

import {
  ComponentType,
  createContext,
  ReactNode,
  useContext,
  useMemo,
} from 'react';

export interface DatasetInfoDetailsConfig {
  icon?: ReactNode;
  externalLink?: ComponentType<{ url: string }>;
}

const DatasetInfoDetailsContext =
  createContext<DatasetInfoDetailsConfig | null>(null);

export interface DatasetInfoDetailsProviderProps {
  value?: DatasetInfoDetailsConfig;
  children: ReactNode;
}

/**
 * DatasetInfoDetailsProvider supplies optional overrides for the dataset
 * row's leading icon and the external-link element rendered by
 * DatasetInfoDetails inside the metadata side panel.
 *
 * @example
 * ```tsx
 * <DatasetInfoDetailsProvider value={{ icon: <MyDatasetIcon /> }}>
 *   <MyLayout />
 * </DatasetInfoDetailsProvider>
 * ```
 *
 * @param value - Optional customization config; omitted keys fall back to DatasetInfoDetails's defaults.
 * @param children - Subtree that gains access to the customization config.
 */
export function DatasetInfoDetailsProvider({
  value,
  children,
}: DatasetInfoDetailsProviderProps) {
  const memo = useMemo(() => value ?? {}, [value]);

  return (
    <DatasetInfoDetailsContext.Provider value={memo}>
      {children}
    </DatasetInfoDetailsContext.Provider>
  );
}

/**
 * Returns the current DatasetInfoDetailsConfig, or null when called outside
 * a DatasetInfoDetailsProvider.
 */
export function useDatasetInfoDetailsConfig() {
  return useContext(DatasetInfoDetailsContext);
}
