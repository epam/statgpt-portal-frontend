'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { GridApi } from 'ag-grid-community';
import type { StructuralData } from '@epam/statgpt-sdmx-toolkit';
import type { AgGridInitialColumnsState } from './AgGridColumnPanel/types';
import { useAgGridColumnPreferences } from './AgGridColumnPanel/hooks/useAgGridColumnPreferences';
import type {
  DimensionCustomizationMap,
  DimensionKeyCustomization,
} from './types';

type TableSettingsContextValue = {
  gridApi?: GridApi;
  onGridApiReady: (api: GridApi) => void;
  initialColumnsState: AgGridInitialColumnsState | null;
  structuresMap?: Map<string, StructuralData | undefined>;
  locale?: string;
  dataQueries?: Array<{ urn: string }>;
  dimensionCustomization: DimensionCustomizationMap;
  setDimensionKeyOrder: (urn: string, colId: string, order: string[]) => void;
  setDimensionKeyHidden: (
    urn: string,
    colId: string,
    dimensionKey: string,
    hidden: boolean,
  ) => void;
  resetDimensionCustomization: () => void;
};

const TableSettingsContext = createContext<TableSettingsContextValue | null>(
  null,
);

/**
 * TableSettingsProvider supplies AG Grid state and dimension customization
 * controls to all table-settings consumers via React context.
 *
 * Column preferences (order, visibility) are persisted and restored per URN
 * through `useAgGridColumnPreferences`. Dimension key ordering and hidden-key
 * sets are held in local state and reset independently.
 *
 * @example
 * Wrap the data-table subtree with the provider
 * ```tsx
 * <TableSettingsProvider
 *   currentUrn={urn}
 *   structuresMap={structuresMap}
 *   locale="en"
 *   dataQueries={queries}
 * >
 *   <AdvancedTable />
 * </TableSettingsProvider>
 * ```
 *
 * @param currentUrn - URN of the active dataset; used to scope persisted column preferences.
 * @param structuresMap - Map from URN to SDMX structural metadata, forwarded to consumers.
 * @param locale - Language tag (e.g. `"en-US"`) passed through to child components.
 * @param dataQueries - List of dataset query descriptors available to consumers.
 * @param children - Subtree that gains access to the table-settings context.
 */
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

  const [dimensionCustomization, setDimensionCustomizationState] =
    useState<DimensionCustomizationMap>(new Map());

  const updateDimensionCustomization = useCallback(
    (
      urn: string,
      colId: string,
      updater: (cur: DimensionKeyCustomization) => DimensionKeyCustomization,
    ) => {
      setDimensionCustomizationState((prev) => {
        const next = new Map(prev);
        const byUrn = new Map(next.get(urn) ?? []);
        const current = byUrn.get(colId) ?? {
          order: [],
          hidden: new Set<string>(),
        };
        byUrn.set(colId, updater(current));
        next.set(urn, byUrn);
        return next;
      });
      gridApi?.refreshCells({ columns: [colId] });
    },
    [gridApi],
  );

  const setDimensionKeyOrder = useCallback(
    (urn: string, colId: string, order: string[]) => {
      updateDimensionCustomization(urn, colId, (current) => ({
        ...current,
        order,
      }));
    },
    [updateDimensionCustomization],
  );

  const resetDimensionCustomization = useCallback(() => {
    setDimensionCustomizationState(new Map());
  }, []);

  const setDimensionKeyHidden = useCallback(
    (urn: string, colId: string, dimensionKey: string, hidden: boolean) => {
      updateDimensionCustomization(urn, colId, (cur) => {
        const newHidden = new Set(cur.hidden);
        if (hidden) {
          newHidden.add(dimensionKey);
        } else {
          newHidden.delete(dimensionKey);
        }
        return { ...cur, hidden: newHidden };
      });
    },
    [updateDimensionCustomization],
  );

  const value = useMemo<TableSettingsContextValue>(
    () => ({
      gridApi,
      onGridApiReady,
      initialColumnsState,
      structuresMap,
      locale,
      dataQueries,
      dimensionCustomization,
      setDimensionKeyOrder,
      setDimensionKeyHidden,
      resetDimensionCustomization,
    }),
    [
      gridApi,
      initialColumnsState,
      onGridApiReady,
      structuresMap,
      locale,
      dataQueries,
      dimensionCustomization,
      setDimensionKeyOrder,
      setDimensionKeyHidden,
      resetDimensionCustomization,
    ],
  );

  return (
    <TableSettingsContext.Provider value={value}>
      {children}
    </TableSettingsContext.Provider>
  );
}

/**
 * Returns the nearest `TableSettingsProvider` context value, throwing if the
 * hook is called outside of a provider.
 */
export function useTableSettingsContext() {
  const ctx = useContext(TableSettingsContext);
  if (!ctx) {
    throw new Error(
      'useTableSettingsContext must be used within TableSettingsProvider',
    );
  }
  return ctx;
}

/**
 * Returns the nearest `TableSettingsProvider` context value, or `null` when
 * called outside of a provider.
 */
export const useTableSettingsContextOptional = () =>
  useContext(TableSettingsContext);
