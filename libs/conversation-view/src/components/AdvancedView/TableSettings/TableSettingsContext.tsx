'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { AgGridInitialColumnsState } from './AgGridColumnPanel/types';
import { useAgGridColumnPreferences } from './AgGridColumnPanel/useAgGridColumnPreferences';

type TableSettingsContextValue = {
  gridApi?: GridApi;
  onGridApiReady: (api: GridApi) => void;
  initialColumnsState: AgGridInitialColumnsState | null;
};

const TableSettingsContext = createContext<TableSettingsContextValue | null>(
  null,
);

export function TableSettingsProvider({
  currentUrn,
  children,
}: {
  currentUrn: string;
  children: ReactNode;
}) {
  const { gridApi, onGridApiReady, initialColumnsState } =
    useAgGridColumnPreferences({ currentUrn });

  const value = useMemo<TableSettingsContextValue>(
    () => ({ gridApi, onGridApiReady, initialColumnsState }),
    [gridApi, initialColumnsState, onGridApiReady],
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
