import { act, renderHook } from '@testing-library/react';
import type { GridApi } from 'ag-grid-community';
import { useAgGridColumnPreferences } from '../useAgGridColumnPreferences';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockApi(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    getColumnState: jest.fn().mockReturnValue([{ colId: 'a', hide: false }]),
    getColumnGroupState: jest
      .fn()
      .mockReturnValue([{ groupId: 'g1', open: true }]),
    applyColumnState: jest.fn(),
    setColumnGroupState: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    isDestroyed: jest.fn(() => false),
    ...overrides,
  } as unknown as GridApi;
}

/** Returns the listener argument registered for the first addEventListener call. */
function captureRegisteredListener(api: GridApi): () => void {
  return (api.addEventListener as jest.Mock).mock.calls[0][1];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAgGridColumnPreferences', () => {
  it('starts with gridApi undefined and initialColumnsState null', () => {
    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:1' }),
    );

    expect(result.current.gridApi).toBeUndefined();
    expect(result.current.initialColumnsState).toBeNull();
  });

  it('sets gridApi after onGridApiReady is called', () => {
    const api = mockApi();
    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:1' }),
    );

    act(() => {
      result.current.onGridApiReady(api);
    });

    expect(result.current.gridApi).toBe(api);
  });

  it('captures and exposes initialColumnsState on first onGridApiReady call', () => {
    const columnState = [{ colId: 'price', hide: false }];
    const columnGroupState = [{ groupId: 'main', open: true }];
    const api = mockApi({
      getColumnState: jest.fn().mockReturnValue(columnState),
      getColumnGroupState: jest.fn().mockReturnValue(columnGroupState),
    });

    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:1' }),
    );

    act(() => {
      result.current.onGridApiReady(api);
    });

    expect(result.current.initialColumnsState).toEqual({
      columnState,
      columnGroupState,
    });
  });

  it('does NOT overwrite initial state on a second onGridApiReady call for the same URN', () => {
    const firstState = [{ colId: 'original', hide: false }];
    const api1 = mockApi({
      getColumnState: jest.fn().mockReturnValue(firstState),
    });
    const api2 = mockApi({
      getColumnState: jest
        .fn()
        .mockReturnValue([{ colId: 'updated', hide: true }]),
    });

    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:1' }),
    );

    act(() => {
      result.current.onGridApiReady(api1);
    });
    act(() => {
      result.current.onGridApiReady(api2);
    });

    // getColumnState should only have been called once (on the first api)
    expect(api1.getColumnState).toHaveBeenCalledTimes(1);
    expect(api2.getColumnState).not.toHaveBeenCalled();

    // initialColumnsState still reflects the first captured state
    expect(result.current.initialColumnsState?.columnState).toBe(firstState);
  });

  it('resets initialColumnsState to null when switching to an unknown URN', () => {
    const api = mockApi();
    const { result, rerender } = renderHook(
      ({ urn }: { urn: string }) =>
        useAgGridColumnPreferences({ currentUrn: urn }),
      { initialProps: { urn: 'urn:1' } },
    );

    act(() => {
      result.current.onGridApiReady(api);
    });

    expect(result.current.initialColumnsState).not.toBeNull();

    // switch to a URN that has never been seen
    act(() => {
      rerender({ urn: 'urn:unknown' });
    });

    expect(result.current.initialColumnsState).toBeNull();
  });

  it('clearInitialColumnState resets initialColumnsState to null', () => {
    const api = mockApi();
    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:1' }),
    );

    act(() => {
      result.current.onGridApiReady(api);
    });

    expect(result.current.initialColumnsState).not.toBeNull();

    act(() => {
      result.current.clearInitialColumnState();
    });

    expect(result.current.initialColumnsState).toBeNull();
  });

  it('restores saved initial state when switching back to a known URN', () => {
    const urn1State = [{ colId: 'x', hide: false }];
    const api1 = mockApi({
      getColumnState: jest.fn().mockReturnValue(urn1State),
    });
    const api2 = mockApi();

    const { result, rerender } = renderHook(
      ({ urn }: { urn: string }) =>
        useAgGridColumnPreferences({ currentUrn: urn }),
      { initialProps: { urn: 'urn:1' } },
    );

    // Visit URN 1 and capture its state
    act(() => {
      result.current.onGridApiReady(api1);
    });

    // Switch to URN 2 and capture its state
    act(() => {
      rerender({ urn: 'urn:2' });
    });
    act(() => {
      result.current.onGridApiReady(api2);
    });

    // Switch back to URN 1
    act(() => {
      rerender({ urn: 'urn:1' });
    });

    expect(result.current.initialColumnsState?.columnState).toBe(urn1State);
  });

  it('restores user-persisted state when onGridApiReady is called after a column event', () => {
    const initialState = [{ colId: 'a', hide: false }];
    const userState = [{ colId: 'a', hide: true }];

    const api = mockApi({
      getColumnState: jest
        .fn()
        .mockReturnValueOnce(initialState) // first call: capture initial
        .mockReturnValue(userState), // subsequent calls: user state
    });

    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:1' }),
    );

    act(() => {
      result.current.onGridApiReady(api);
    });

    // Simulate a column event firing → this calls persistUserState internally
    act(() => {
      const listener = captureRegisteredListener(api);
      listener();
    });

    // Call onGridApiReady again (e.g. grid remounted) — should restore user state
    const api2 = mockApi();
    act(() => {
      result.current.onGridApiReady(api2);
    });

    expect(api2.applyColumnState).toHaveBeenCalledWith({
      state: userState,
      applyOrder: true,
    });
    expect(api2.setColumnGroupState).toHaveBeenCalled();
  });

  it('does not restore user state on first onGridApiReady when no column event has fired', () => {
    const api = mockApi();
    const { result } = renderHook(() =>
      useAgGridColumnPreferences({ currentUrn: 'urn:1' }),
    );

    act(() => {
      result.current.onGridApiReady(api);
    });

    expect(api.applyColumnState).not.toHaveBeenCalled();
    expect(api.setColumnGroupState).not.toHaveBeenCalled();
  });
});
