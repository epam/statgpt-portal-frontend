import type { GridApi } from 'ag-grid-community';
import type { AgGridInitialColumnsState } from '../types';

/**
 * Reads the current column and column-group state from an AG Grid instance and returns it as a snapshot.
 *
 * @param api - The AG Grid API instance to read column state from.
 * @returns A snapshot containing both column state and column group state.
 */
export function captureInitialColumnsState(
  api: GridApi,
): AgGridInitialColumnsState {
  return {
    columnState: api.getColumnState(),
    columnGroupState: api.getColumnGroupState(),
  };
}

/**
 * Applies a previously captured column state snapshot back to an AG Grid instance.
 *
 * @param api - The AG Grid API instance to restore column state on.
 * @param initialState - The snapshot to restore; does nothing when absent or null.
 */
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
