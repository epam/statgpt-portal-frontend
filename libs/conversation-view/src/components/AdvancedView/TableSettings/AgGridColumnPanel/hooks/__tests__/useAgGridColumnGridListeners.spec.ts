import { renderHook } from '@testing-library/react';
import type { GridApi } from 'ag-grid-community';
import { useAgGridColumnGridListeners } from '../useAgGridColumnGridListeners';

const EXPECTED_EVENTS = [
  'columnVisible',
  'columnMoved',
  'displayedColumnsChanged',
  'newColumnsLoaded',
  'gridColumnsChanged',
  'columnPinned',
] as const;

function mockApi() {
  return {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  } as unknown as GridApi;
}

describe('useAgGridColumnGridListeners', () => {
  it('registers all 6 column events on mount', () => {
    const api = mockApi();
    const listener = jest.fn();

    renderHook(() => useAgGridColumnGridListeners(api, listener));

    expect(api.addEventListener).toHaveBeenCalledTimes(6);

    const registeredEvents = (
      api.addEventListener as jest.Mock
    ).mock.calls.map(([event]) => event);
    expect(registeredEvents).toEqual(expect.arrayContaining([...EXPECTED_EVENTS]));
  });

  it('registers the provided listener for every event', () => {
    const api = mockApi();
    const listener = jest.fn();

    renderHook(() => useAgGridColumnGridListeners(api, listener));

    for (const [, registeredListener] of (api.addEventListener as jest.Mock)
      .mock.calls) {
      expect(registeredListener).toBe(listener);
    }
  });

  it('removes all 6 events on unmount', () => {
    const api = mockApi();
    const listener = jest.fn();

    const { unmount } = renderHook(() =>
      useAgGridColumnGridListeners(api, listener),
    );

    unmount();

    expect(api.removeEventListener).toHaveBeenCalledTimes(6);
    const removedEvents = (
      api.removeEventListener as jest.Mock
    ).mock.calls.map(([event]) => event);
    expect(removedEvents).toEqual(expect.arrayContaining([...EXPECTED_EVENTS]));
  });

  it('removes the same listener it registered', () => {
    const api = mockApi();
    const listener = jest.fn();

    const { unmount } = renderHook(() =>
      useAgGridColumnGridListeners(api, listener),
    );
    unmount();

    for (const [, removedListener] of (api.removeEventListener as jest.Mock)
      .mock.calls) {
      expect(removedListener).toBe(listener);
    }
  });

  it('does nothing when api is null', () => {
    const listener = jest.fn();

    // Should not throw
    renderHook(() => useAgGridColumnGridListeners(null, listener));
  });

  it('does nothing when api is undefined', () => {
    const listener = jest.fn();

    renderHook(() => useAgGridColumnGridListeners(undefined, listener));
  });

  it('removes listeners from the old api and registers on the new api when api changes', () => {
    const api1 = mockApi();
    const api2 = mockApi();
    const listener = jest.fn();

    const { rerender } = renderHook(
      ({ api }: { api: GridApi }) =>
        useAgGridColumnGridListeners(api, listener),
      { initialProps: { api: api1 } },
    );

    expect(api1.addEventListener).toHaveBeenCalledTimes(6);
    expect(api2.addEventListener).not.toHaveBeenCalled();

    rerender({ api: api2 });

    expect(api1.removeEventListener).toHaveBeenCalledTimes(6);
    expect(api2.addEventListener).toHaveBeenCalledTimes(6);
  });

  it('re-registers when the listener reference changes', () => {
    const api = mockApi();
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const { rerender } = renderHook(
      ({ listener }: { listener: () => void }) =>
        useAgGridColumnGridListeners(api, listener),
      { initialProps: { listener: listener1 } },
    );

    expect(api.addEventListener).toHaveBeenCalledTimes(6);

    rerender({ listener: listener2 });

    // Old listeners removed, new ones added
    expect(api.removeEventListener).toHaveBeenCalledTimes(6);
    expect(api.addEventListener).toHaveBeenCalledTimes(12);
  });
});
