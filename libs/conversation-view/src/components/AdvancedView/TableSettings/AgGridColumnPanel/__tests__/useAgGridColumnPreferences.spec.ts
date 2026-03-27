jest.mock('@epam/statgpt-sdmx-toolkit', () => ({}));

import { renderHook, act } from '@testing-library/react';
import { useAgGridColumnPreferences } from '../useAgGridColumnPreferences';
import type { GridApi } from 'ag-grid-community';

function createMockApi(
  columnState: any[] = [],
  columnGroupState: any[] = [],
): GridApi {
  return {
    getColumnState: jest.fn().mockReturnValue(columnState),
    getColumnGroupState: jest.fn().mockReturnValue(columnGroupState),
    applyColumnState: jest.fn(),
    setColumnGroupState: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  } as unknown as GridApi;
}

describe('useAgGridColumnPreferences', () => {
  it('captures and exposes initial column state when onGridApiReady is called for the first time', () => {
    const columnState = [{ colId: 'col1', hide: false }];
    const columnGroupState = [{ groupId: 'g1', open: true }];
    const api = createMockApi(columnState, columnGroupState);

    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:test' }),
    );

    act(() => {
      result.current.onGridApiReady(api);
    });

    expect(result.current.initialColumnsState).toEqual({
      columnState,
      columnGroupState,
    });
  });

  it('does not overwrite initial state when onGridApiReady is called again for the same URN', () => {
    const firstState = [{ colId: 'col1', hide: false }];
    const secondState = [{ colId: 'col2', hide: true }];
    const api1 = createMockApi(firstState, []);
    const api2 = createMockApi(secondState, []);

    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:test' }),
    );

    act(() => {
      result.current.onGridApiReady(api1);
    });

    act(() => {
      result.current.onGridApiReady(api2);
    });

    expect(result.current.initialColumnsState?.columnState).toEqual(firstState);
  });

  it('restores previously persisted user state when the same URN is re-registered', () => {
    const columnState = [{ colId: 'col1', hide: true }];
    const columnGroupState = [{ groupId: 'g1', open: false }];
    const api = createMockApi(columnState, columnGroupState);

    const registeredListeners = new Map<string, () => void>();
    (api.addEventListener as jest.Mock).mockImplementation(
      (event: string, cb: () => void) => {
        registeredListeners.set(event, cb);
      },
    );

    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:test' }),
    );

    act(() => {
      result.current.onGridApiReady(api);
    });

    // Simulate a grid event to trigger persistUserState
    act(() => {
      registeredListeners.get('columnMoved')?.();
    });

    // Register a new api for the same URN — the persisted user state should be applied
    const api2 = createMockApi([], []);
    act(() => {
      result.current.onGridApiReady(api2);
    });

    expect(api2.applyColumnState).toHaveBeenCalledWith({
      state: columnState,
      applyOrder: true,
    });
    expect(api2.setColumnGroupState).toHaveBeenCalledWith(columnGroupState);
  });

  it('resets initialColumnsState to null when switching to an unknown URN', () => {
    const api = createMockApi([{ colId: 'col1', hide: false }], []);

    const { result, rerender } = renderHook(
      ({ urn }) => useAgGridColumnPreferences({ currentUrn: urn }),
      { initialProps: { urn: 'urn:A' } },
    );

    act(() => {
      result.current.onGridApiReady(api);
    });

    rerender({ urn: 'urn:B' });

    expect(result.current.initialColumnsState).toBeNull();
  });

  it('restores the correct initialColumnsState when switching back to a previously loaded URN', () => {
    const stateA = [{ colId: 'colA', hide: false }];
    const stateB = [{ colId: 'colB', hide: false }];
    const apiA = createMockApi(stateA, []);
    const apiB = createMockApi(stateB, []);

    const { result, rerender } = renderHook(
      ({ urn }) => useAgGridColumnPreferences({ currentUrn: urn }),
      { initialProps: { urn: 'urn:A' } },
    );

    act(() => {
      result.current.onGridApiReady(apiA);
    });

    rerender({ urn: 'urn:B' });

    act(() => {
      result.current.onGridApiReady(apiB);
    });

    rerender({ urn: 'urn:A' });

    expect(result.current.initialColumnsState?.columnState).toEqual(stateA);
  });
});
