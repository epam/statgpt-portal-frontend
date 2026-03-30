import type { GridApi } from 'ag-grid-community';
import {
  captureInitialColumnsState,
  restoreInitialColumnsState,
} from '../columnStateSnapshot';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockApi(overrides: Partial<Record<keyof GridApi, jest.Mock>> = {}) {
  return {
    getColumnState: jest.fn().mockReturnValue([{ colId: 'a', hide: false }]),
    getColumnGroupState: jest
      .fn()
      .mockReturnValue([{ groupId: 'g1', open: true }]),
    applyColumnState: jest.fn(),
    setColumnGroupState: jest.fn(),
    ...overrides,
  } as unknown as GridApi;
}

// ---------------------------------------------------------------------------
// captureInitialColumnsState
// ---------------------------------------------------------------------------

describe('captureInitialColumnsState', () => {
  it('returns the column state from the api', () => {
    const columnState = [{ colId: 'price', hide: false }];
    const api = mockApi({
      getColumnState: jest.fn().mockReturnValue(columnState),
    });

    const snapshot = captureInitialColumnsState(api);

    expect(snapshot.columnState).toBe(columnState);
  });

  it('returns the column group state from the api', () => {
    const columnGroupState = [{ groupId: 'main', open: false }];
    const api = mockApi({
      getColumnGroupState: jest.fn().mockReturnValue(columnGroupState),
    });

    const snapshot = captureInitialColumnsState(api);

    expect(snapshot.columnGroupState).toBe(columnGroupState);
  });

  it('calls getColumnState and getColumnGroupState exactly once', () => {
    const api = mockApi();
    captureInitialColumnsState(api);

    expect(api.getColumnState).toHaveBeenCalledTimes(1);
    expect(api.getColumnGroupState).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// restoreInitialColumnsState
// ---------------------------------------------------------------------------

describe('restoreInitialColumnsState', () => {
  it('applies column state with applyOrder: true', () => {
    const api = mockApi();
    const columnState = [{ colId: 'a', hide: true }];
    const columnGroupState = [{ groupId: 'g1', open: false }];

    restoreInitialColumnsState(api, { columnState, columnGroupState });

    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: columnState,
      applyOrder: true,
    });
  });

  it('restores column group state', () => {
    const api = mockApi();
    const columnGroupState = [{ groupId: 'g1', open: false }];

    restoreInitialColumnsState(api, {
      columnState: [],
      columnGroupState,
    });

    expect(api.setColumnGroupState).toHaveBeenCalledWith(columnGroupState);
  });

  it('does nothing when initialState is null', () => {
    const api = mockApi();

    restoreInitialColumnsState(api, null);

    expect(api.applyColumnState).not.toHaveBeenCalled();
    expect(api.setColumnGroupState).not.toHaveBeenCalled();
  });

  it('does nothing when initialState is undefined', () => {
    const api = mockApi();

    restoreInitialColumnsState(api, undefined);

    expect(api.applyColumnState).not.toHaveBeenCalled();
    expect(api.setColumnGroupState).not.toHaveBeenCalled();
  });
});
