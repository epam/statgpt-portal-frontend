import { renderHook } from '@testing-library/react';
import { useAgGridColumnGridListeners } from '../useAgGridColumnGridListeners';
import type { GridApi } from 'ag-grid-community';

function createMockApi(): GridApi {
  return {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  } as unknown as GridApi;
}

const SYNC_EVENTS = [
  'columnVisible',
  'columnMoved',
  'displayedColumnsChanged',
  'newColumnsLoaded',
  'gridColumnsChanged',
  'columnPinned',
] as const;

describe('useAgGridColumnGridListeners', () => {
  it('registers all sync events on the api when mounted', () => {
    const api = createMockApi();
    const listener = jest.fn();

    renderHook(() => useAgGridColumnGridListeners(api, listener));

    for (const event of SYNC_EVENTS) {
      expect(api.addEventListener).toHaveBeenCalledWith(event, listener);
    }
    expect((api.addEventListener as jest.Mock).mock.calls).toHaveLength(
      SYNC_EVENTS.length,
    );
  });

  it('removes all sync events from the api on unmount', () => {
    const api = createMockApi();
    const listener = jest.fn();

    const { unmount } = renderHook(() =>
      useAgGridColumnGridListeners(api, listener),
    );
    unmount();

    for (const event of SYNC_EVENTS) {
      expect(api.removeEventListener).toHaveBeenCalledWith(event, listener);
    }
    expect((api.removeEventListener as jest.Mock).mock.calls).toHaveLength(
      SYNC_EVENTS.length,
    );
  });

  it('registers no listeners and does not throw when api is null', () => {
    const listener = jest.fn();
    expect(() =>
      renderHook(() => useAgGridColumnGridListeners(null, listener)),
    ).not.toThrow();
  });

  it('deregisters listeners from the old api and registers on the new api when api changes', () => {
    const api1 = createMockApi();
    const api2 = createMockApi();
    const listener = jest.fn();

    const { rerender } = renderHook(
      ({ api }) => useAgGridColumnGridListeners(api, listener),
      { initialProps: { api: api1 } },
    );

    rerender({ api: api2 });

    expect((api1.removeEventListener as jest.Mock).mock.calls).toHaveLength(
      SYNC_EVENTS.length,
    );
    expect((api2.addEventListener as jest.Mock).mock.calls).toHaveLength(
      SYNC_EVENTS.length,
    );
  });
});
