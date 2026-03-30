import type { GridApi } from 'ag-grid-community';
import type { AgGridInitialColumnsState } from '../types';

export function captureInitialColumnsState(
  api: GridApi,
): AgGridInitialColumnsState {
  return {
    columnState: api.getColumnState(),
    columnGroupState: api.getColumnGroupState(),
  };
}

export function restoreInitialColumnsState(
  api: GridApi,
  initialState?: AgGridInitialColumnsState | null,
) {
  if (!initialState) {
    return;
  }

  api.applyColumnState({
    state: initialState.columnState,
    applyOrder: true,
  });

  api.setColumnGroupState(initialState.columnGroupState);
}
