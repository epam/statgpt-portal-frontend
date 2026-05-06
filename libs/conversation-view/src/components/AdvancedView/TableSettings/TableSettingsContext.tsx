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
import { CrossDatasetGridViewMode } from './types';
import type { AttachmentsStyles } from '../../../models/attachments-styles';

type TableSettingsTexts = Pick<
  AttachmentsStyles,
  | 'columnsDisplayTitle'
  | 'columnsSearchPlaceholder'
  | 'compactViewTitle'
  | 'compactViewDescription'
  | 'extendedViewTitle'
  | 'extendedViewDescription'
>;

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
  clearUserColumnState: () => void;
  clearInitialColumnState: () => void;
  gridViewMode: CrossDatasetGridViewMode;
  setGridViewMode: (mode: CrossDatasetGridViewMode) => void;
  texts?: TableSettingsTexts;
  resetIcon?: ReactNode;
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
  gridViewMode = CrossDatasetGridViewMode.Compact,
  onGridViewModeChange,
  texts,
  resetIcon,
  children,
}: {
  currentUrn: string;
  structuresMap?: Map<string, StructuralData | undefined>;
  locale?: string;
  dataQueries?: Array<{ urn: string }>;
  gridViewMode?: CrossDatasetGridViewMode;
  onGridViewModeChange?: (mode: CrossDatasetGridViewMode) => void;
  texts?: TableSettingsTexts;
  resetIcon?: ReactNode;
  children: ReactNode;
}) {
  const {
    gridApi,
    onGridApiReady,
    initialColumnsState,
    clearUserColumnState,
    clearInitialColumnState,
  } = useAgGridColumnPreferences({ currentUrn });

  const setGridViewMode = useCallback(
    (mode: CrossDatasetGridViewMode) => onGridViewModeChange?.(mode),
    [onGridViewModeChange],
  );

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
      clearUserColumnState,
      clearInitialColumnState,
      gridViewMode,
      setGridViewMode,
      texts,
      resetIcon,
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
      clearUserColumnState,
      clearInitialColumnState,
      gridViewMode,
      setGridViewMode,
      texts,
      resetIcon,
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
