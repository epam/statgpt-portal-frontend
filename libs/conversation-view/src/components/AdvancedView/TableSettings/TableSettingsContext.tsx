'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { StructuralData } from '@epam/statgpt-sdmx-toolkit';
import type { AgGridInitialColumnsState } from './AgGridColumnPanel/types';
import { useAgGridColumnPreferences } from './AgGridColumnPanel/useAgGridColumnPreferences';

type TableSettingsContextValue = {
  gridApi?: GridApi;
  onGridApiReady: (api: GridApi) => void;
  initialColumnsState: AgGridInitialColumnsState | null;
  structuresMap?: Map<string, StructuralData | undefined>;
  locale?: string;
  dataQueries?: Array<{ urn: string }>;
};

const TableSettingsContext = createContext<TableSettingsContextValue | null>(
  null,
);

export function TableSettingsProvider({
  currentUrn,
  structuresMap,
  locale,
  dataQueries,
  children,
}: {
  currentUrn: string;
  structuresMap?: Map<string, StructuralData | undefined>;
  locale?: string;
  dataQueries?: Array<{ urn: string }>;
  children: ReactNode;
}) {
  const { gridApi, onGridApiReady, initialColumnsState } =
    useAgGridColumnPreferences({ currentUrn });

  const value = useMemo<TableSettingsContextValue>(
    () => ({
      gridApi,
      onGridApiReady,
      initialColumnsState,
      structuresMap,
      locale,
      dataQueries,
    }),
    [
      gridApi,
      initialColumnsState,
      onGridApiReady,
      structuresMap,
      locale,
      dataQueries,
    ],
  );

  return (
    <TableSettingsContext.Provider value={value}>
      {children}
    </TableSettingsContext.Provider>
  );
}

export function useTableSettingsContext() {
  const ctx = useContext(TableSettingsContext);
  if (!ctx) {
    throw new Error(
      'useTableSettingsContext must be used within TableSettingsProvider',
    );
  }
  return ctx;
}
