'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { AgGridInitialColumnsState } from './types';
import {
  captureInitialColumnsState,
  restoreInitialColumnsState,
} from './helpers';

export function useAgGridColumnsReset(api?: GridApi | null) {
  const lastApiRef = useRef<GridApi | null>(null);
  const initialStateRef = useRef<AgGridInitialColumnsState | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    if (lastApiRef.current !== api) {
      lastApiRef.current = api;
      initialStateRef.current = captureInitialColumnsState(api);
    }
  }, [api]);

  const resetColumns = useCallback(() => {
    if (!api) {
      return;
    }

    restoreInitialColumnsState(api, initialStateRef.current);
  }, [api]);

  return {
    resetColumns,
    hasInitialState: !!initialStateRef.current,
  };
}
