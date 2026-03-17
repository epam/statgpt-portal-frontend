'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { AgGridInitialColumnsState } from './types';
import { captureInitialColumnsState } from './helpers';

export function useAgGridColumnPreferences({
  currentUrn,
}: {
  currentUrn: string;
}) {
  const [gridApi, setGridApi] = useState<GridApi>();

  const columnsInitialStateByUrnRef = useRef(
    new Map<string, AgGridInitialColumnsState>(),
  );
  const columnsUserStateByUrnRef = useRef(
    new Map<string, AgGridInitialColumnsState>(),
  );

  const onGridApiReady = useCallback(
    (api: GridApi) => {
      setGridApi(api);

      if (!columnsInitialStateByUrnRef.current.has(currentUrn)) {
        columnsInitialStateByUrnRef.current.set(
          currentUrn,
          captureInitialColumnsState(api),
        );
      }

      const userState = columnsUserStateByUrnRef.current.get(currentUrn);
      if (userState) {
        api.applyColumnState({
          state: userState.columnState,
          applyOrder: true,
        });
        api.setColumnGroupState(userState.columnGroupState);
      }
    },
    [currentUrn],
  );

  const initialColumnsState = useMemo(
    () => columnsInitialStateByUrnRef.current.get(currentUrn) ?? null,
    [currentUrn],
  );

  useEffect(() => {
    if (!gridApi) {
      return;
    }

    const urnForThisGrid = currentUrn;
    const listener = () => {
      columnsUserStateByUrnRef.current.set(
        urnForThisGrid,
        captureInitialColumnsState(gridApi),
      );
    };

    gridApi.addEventListener('columnVisible', listener);
    gridApi.addEventListener('columnMoved', listener);
    gridApi.addEventListener('displayedColumnsChanged', listener);
    gridApi.addEventListener('newColumnsLoaded', listener);
    gridApi.addEventListener('gridColumnsChanged', listener);
    gridApi.addEventListener('columnPinned', listener);
    gridApi.addEventListener('columnResized', listener);

    return () => {
      gridApi.removeEventListener('columnVisible', listener);
      gridApi.removeEventListener('columnMoved', listener);
      gridApi.removeEventListener('displayedColumnsChanged', listener);
      gridApi.removeEventListener('newColumnsLoaded', listener);
      gridApi.removeEventListener('gridColumnsChanged', listener);
      gridApi.removeEventListener('columnPinned', listener);
      gridApi.removeEventListener('columnResized', listener);
    };
  }, [gridApi, currentUrn]);

  return {
    gridApi,
    onGridApiReady,
    initialColumnsState,
  };
}

