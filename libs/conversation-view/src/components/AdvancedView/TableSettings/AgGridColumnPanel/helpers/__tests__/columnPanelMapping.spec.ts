import type { ColDef, GridApi } from 'ag-grid-community';
import {
  buildColumnStateMap,
  DEFAULT_INCLUDE_COLUMN,
  getColId,
  getColLabel,
  mapColumnsToPanelItems,
  mergeIncludedOrderIntoFullOrder,
} from '../columnPanelMapping';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function colDef(overrides: Partial<ColDef> = {}): ColDef {
  return overrides;
}

function mockApi(
  defs: ColDef[],
  state: { colId: string; hide?: boolean }[],
): GridApi {
  return {
    getColumnDefs: jest.fn().mockReturnValue(defs),
    getColumnState: jest.fn().mockReturnValue(state),
  } as unknown as GridApi;
}

// ---------------------------------------------------------------------------
// DEFAULT_INCLUDE_COLUMN
// ---------------------------------------------------------------------------

describe('DEFAULT_INCLUDE_COLUMN', () => {
  it('includes a column with a non-empty label and no suppressColumnsToolPanel', () => {
    expect(
      DEFAULT_INCLUDE_COLUMN({
        colId: 'a',
        label: 'Name',
        colDef: colDef({ headerName: 'Name' }),
      }),
    ).toBe(true);
  });

  it('excludes a column whose label is empty', () => {
    expect(
      DEFAULT_INCLUDE_COLUMN({ colId: 'a', label: '', colDef: colDef() }),
    ).toBe(false);
  });

  it('excludes a column whose label is whitespace only', () => {
    expect(
      DEFAULT_INCLUDE_COLUMN({ colId: 'a', label: '   ', colDef: colDef() }),
    ).toBe(false);
  });

  it('excludes a column with suppressColumnsToolPanel: true', () => {
    expect(
      DEFAULT_INCLUDE_COLUMN({
        colId: 'a',
        label: 'Name',
        colDef: colDef({ suppressColumnsToolPanel: true }),
      }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getColId
// ---------------------------------------------------------------------------

describe('getColId', () => {
  it('returns colId when present', () => {
    expect(getColId(colDef({ colId: 'myId', field: 'myField' }))).toBe('myId');
  });

  it('falls back to field when colId is absent', () => {
    expect(getColId(colDef({ field: 'myField' }))).toBe('myField');
  });

  it('returns null when neither colId nor field is present', () => {
    expect(getColId(colDef())).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getColLabel
// ---------------------------------------------------------------------------

describe('getColLabel', () => {
  it('returns trimmed headerName when present', () => {
    expect(getColLabel(colDef({ headerName: '  Price  ' }))).toBe('Price');
  });

  it('falls back to field when headerName is absent', () => {
    expect(getColLabel(colDef({ field: 'price' }))).toBe('price');
  });

  it('falls back to colId when neither headerName nor field is present', () => {
    expect(getColLabel(colDef({ colId: 'priceCol' }))).toBe('priceCol');
  });

  it('returns empty string when all are absent', () => {
    expect(getColLabel(colDef())).toBe('');
  });
});

// ---------------------------------------------------------------------------
// mergeIncludedOrderIntoFullOrder
// ---------------------------------------------------------------------------

describe('mergeIncludedOrderIntoFullOrder', () => {
  it('replaces all slots when every column is in the included set', () => {
    expect(
      mergeIncludedOrderIntoFullOrder(
        ['a', 'b', 'c'],
        ['c', 'a', 'b'],
        new Set(['a', 'b', 'c']),
      ),
    ).toEqual(['c', 'a', 'b']);
  });

  it('keeps excluded columns in their original positions', () => {
    // 'x' is not in includedSet and stays put at index 1
    expect(
      mergeIncludedOrderIntoFullOrder(
        ['a', 'x', 'b'],
        ['b', 'a'],
        new Set(['a', 'b']),
      ),
    ).toEqual(['b', 'x', 'a']);
  });

  it('preserves multiple excluded columns scattered throughout the order', () => {
    expect(
      mergeIncludedOrderIntoFullOrder(
        ['a', 'pinned1', 'b', 'pinned2', 'c'],
        ['c', 'b', 'a'],
        new Set(['a', 'b', 'c']),
      ),
    ).toEqual(['c', 'pinned1', 'b', 'pinned2', 'a']);
  });

  it('returns full order unchanged when includedOrder is empty', () => {
    expect(
      mergeIncludedOrderIntoFullOrder(
        ['a', 'b', 'c'],
        [],
        new Set(['a', 'b', 'c']),
      ),
    ).toEqual(['a', 'b', 'c']);
  });

  it('returns full order unchanged when includedSet is empty', () => {
    expect(
      mergeIncludedOrderIntoFullOrder(
        ['a', 'b', 'c'],
        ['c', 'b', 'a'],
        new Set(),
      ),
    ).toEqual(['a', 'b', 'c']);
  });

  it('handles a single included column with no reordering', () => {
    expect(
      mergeIncludedOrderIntoFullOrder(['a'], ['a'], new Set(['a'])),
    ).toEqual(['a']);
  });
});

// ---------------------------------------------------------------------------
// buildColumnStateMap
// ---------------------------------------------------------------------------

describe('buildColumnStateMap', () => {
  it('builds a Map keyed by colId', () => {
    const stateA = { colId: 'a', hide: false };
    const stateB = { colId: 'b', hide: true };
    const api = mockApi([], [stateA, stateB]);

    const result = buildColumnStateMap(api);

    expect(result.get('a')).toBe(stateA);
    expect(result.get('b')).toBe(stateB);
    expect(result.size).toBe(2);
  });

  it('returns an empty map when column state is empty', () => {
    const api = mockApi([], []);
    expect(buildColumnStateMap(api).size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// mapColumnsToPanelItems
// ---------------------------------------------------------------------------

describe('mapColumnsToPanelItems', () => {
  const includeAll = () => true;

  it('produces one item per column def', () => {
    const api = mockApi(
      [colDef({ colId: 'a', headerName: 'A' }), colDef({ colId: 'b', headerName: 'B' })],
      [{ colId: 'a' }, { colId: 'b' }],
    );
    const items = mapColumnsToPanelItems(api, includeAll);
    expect(items).toHaveLength(2);
  });

  it('sorts items by the column state order, not the colDef order', () => {
    // defs in order a, b — but state puts b before a
    const api = mockApi(
      [colDef({ colId: 'a', headerName: 'A' }), colDef({ colId: 'b', headerName: 'B' })],
      [{ colId: 'b' }, { colId: 'a' }],
    );
    const items = mapColumnsToPanelItems(api, includeAll);
    expect(items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('sets isChecked: false for hidden columns', () => {
    const api = mockApi(
      [colDef({ colId: 'a', headerName: 'A' })],
      [{ colId: 'a', hide: true }],
    );
    const [item] = mapColumnsToPanelItems(api, includeAll);
    expect(item.type).toBe('item');
    if (item.type === 'item') {
      expect(item.isChecked).toBe(false);
    }
  });

  it('sets isChecked: true for visible columns', () => {
    const api = mockApi(
      [colDef({ colId: 'a', headerName: 'A' })],
      [{ colId: 'a', hide: false }],
    );
    const [item] = mapColumnsToPanelItems(api, includeAll);
    if (item.type === 'item') {
      expect(item.isChecked).toBe(true);
    }
  });

  it('sets draggable and checkable on every item', () => {
    const api = mockApi(
      [colDef({ colId: 'a', headerName: 'A' })],
      [{ colId: 'a' }],
    );
    const [item] = mapColumnsToPanelItems(api, includeAll);
    if (item.type === 'item') {
      expect(item.draggable).toBe(true);
      expect(item.checkable).toBe(true);
    }
  });

  it('excludes columns rejected by the includeColumn filter', () => {
    const api = mockApi(
      [
        colDef({ colId: 'visible', headerName: 'Visible' }),
        colDef({ colId: 'hidden', headerName: 'Hidden' }),
      ],
      [{ colId: 'visible' }, { colId: 'hidden' }],
    );
    const filter = ({ colId }: { colId: string }) => colId !== 'hidden';
    const items = mapColumnsToPanelItems(api, filter);
    expect(items.map((i) => i.id)).toEqual(['visible']);
  });

  it('skips column defs with no colId and no field', () => {
    const api = mockApi(
      [colDef({ headerName: 'NoId' }), colDef({ colId: 'ok', headerName: 'OK' })],
      [{ colId: 'ok' }],
    );
    const items = mapColumnsToPanelItems(api, includeAll);
    expect(items.map((i) => i.id)).toEqual(['ok']);
  });
});
