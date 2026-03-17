'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { AgGridInitialColumnsState } from './AgGridColumnPanel/types';
import { useAgGridColumnPreferences } from './AgGridColumnPanel/useAgGridColumnPreferences';

type TableSettingsState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

type TableSettingsContextValue = {
  tableSettings: TableSettingsState;
  agGrid: {
    gridApi?: GridApi;
    onGridApiReady: (api: GridApi) => void;
    initialColumnsState: AgGridInitialColumnsState | null;
  };
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
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const { gridApi, onGridApiReady, initialColumnsState } =
    useAgGridColumnPreferences({ currentUrn });

  const value = useMemo<TableSettingsContextValue>(
    () => ({
      tableSettings: { isOpen, open, close, toggle },
      agGrid: { gridApi, onGridApiReady, initialColumnsState },
    }),
    [gridApi, initialColumnsState, isOpen, onGridApiReady, open, close, toggle],
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

