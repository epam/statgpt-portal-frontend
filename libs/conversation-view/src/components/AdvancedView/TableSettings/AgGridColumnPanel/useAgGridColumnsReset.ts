'use client';

import { useCallback } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { AgGridInitialColumnsState } from './types';
import { restoreInitialColumnsState } from './helpers';

export function useAgGridColumnsReset(
  api?: GridApi | null,
  initialState?: AgGridInitialColumnsState | null,
) {
  const resetColumns = useCallback(() => {
    if (!api) {
      return;
    }

    restoreInitialColumnsState(api, initialState);
  }, [api, initialState]);

  return {
    resetColumns,
  };
}
