'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { AgGridInitialColumnsState } from './types';
import { captureInitialColumnsState } from './helpers/columnStateSnapshot';
import { useAgGridColumnGridListeners } from './useAgGridColumnGridListeners';

export function useAgGridColumnPreferences({
  currentUrn,
}: {
  currentUrn: string;
}) {
  const [gridApi, setGridApi] = useState<GridApi>();
  const [initialColumnsState, setInitialColumnsState] =
    useState<AgGridInitialColumnsState | null>(null);

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
        const captured = captureInitialColumnsState(api);
        columnsInitialStateByUrnRef.current.set(currentUrn, captured);
        setInitialColumnsState(captured);
      } else if (initialColumnsState == null) {
        setInitialColumnsState(
          columnsInitialStateByUrnRef.current.get(currentUrn) ?? null,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUrn],
  );

  useEffect(() => {
    setInitialColumnsState(
      columnsInitialStateByUrnRef.current.get(currentUrn) ?? null,
    );
  }, [currentUrn]);

  const persistUserState = useCallback(() => {
    if (!gridApi) {
      return;
    }

    columnsUserStateByUrnRef.current.set(
      currentUrn,
      captureInitialColumnsState(gridApi),
    );
  }, [currentUrn, gridApi]);

  useAgGridColumnGridListeners(gridApi, persistUserState);

  return {
    gridApi,
    onGridApiReady,
    initialColumnsState,
  };
}
