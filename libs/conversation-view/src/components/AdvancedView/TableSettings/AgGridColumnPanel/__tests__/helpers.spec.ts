import {
  DEFAULT_INCLUDE_COLUMN,
  getColId,
  getColLabel,
  buildColumnStateMap,
  mapColumnsToPanelItems,
  getItemNodeByPath,
  flattenIncludedLeafIds,
  mergeIncludedOrderIntoFullOrder,
  captureInitialColumnsState,
  restoreInitialColumnsState,
  buildCrossDatasetEnrichItem,
} from '../helpers';
import type { GridApi } from 'ag-grid-community';
import {
  INDICATOR_COL_ID,
  COUNTRY_COL_ID,
} from '../../../../../constants/cross-dataset-grid';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getDimensionTitle: jest.fn(),
  getDimensions: jest.fn(),
  getLocalizedName: jest.fn(),
}));

import {
  getDimensionTitle,
  getDimensions,
  getLocalizedName,
} from '@epam/statgpt-sdmx-toolkit';

function createMockApi(
  columnDefs: any[] = [],
  columnState: any[] = [],
  columnGroupState: any[] = [],
): GridApi {
  return {
    getColumnDefs: jest.fn().mockReturnValue(columnDefs),
    getColumnState: jest.fn().mockReturnValue(columnState),
    getColumnGroupState: jest.fn().mockReturnValue(columnGroupState),
    applyColumnState: jest.fn(),
    setColumnGroupState: jest.fn(),
  } as unknown as GridApi;
}

describe('DEFAULT_INCLUDE_COLUMN', () => {
  it('includes a column with a non-empty label', () => {
    expect(
      DEFAULT_INCLUDE_COLUMN({ colId: 'col1', label: 'Name', colDef: {} }),
    ).toBe(true);
  });

  it('excludes a column with an empty label', () => {
    expect(
      DEFAULT_INCLUDE_COLUMN({ colId: 'col1', label: '', colDef: {} }),
    ).toBe(false);
  });

  it('excludes a column with a whitespace-only label', () => {
    expect(
      DEFAULT_INCLUDE_COLUMN({ colId: 'col1', label: '   ', colDef: {} }),
    ).toBe(false);
  });

  it('excludes a column with suppressColumnsToolPanel set to true', () => {
    expect(
      DEFAULT_INCLUDE_COLUMN({
        colId: 'col1',
        label: 'Name',
        colDef: { suppressColumnsToolPanel: true },
      }),
    ).toBe(false);
  });
});

describe('getColId', () => {
  it('returns colId when defined', () => {
    expect(getColId({ colId: 'myCol', field: 'myField' })).toBe('myCol');
  });

  it('falls back to field when colId is undefined', () => {
    expect(getColId({ field: 'myField' })).toBe('myField');
  });

  it('returns null when neither colId nor field is defined', () => {
    expect(getColId({})).toBeNull();
  });
});

describe('getColLabel', () => {
  it('returns headerName when defined', () => {
    expect(getColLabel({ headerName: 'My Header', field: 'field' })).toBe(
      'My Header',
    );
  });

  it('falls back to field when headerName is undefined', () => {
    expect(getColLabel({ field: 'myField' })).toBe('myField');
  });

  it('falls back to colId when field is also undefined', () => {
    expect(getColLabel({ colId: 'myCol' })).toBe('myCol');
  });

  it('trims whitespace from the label', () => {
    expect(getColLabel({ headerName: '  Column Name  ' })).toBe('Column Name');
  });

  it('returns empty string when no identifying fields are defined', () => {
    expect(getColLabel({})).toBe('');
  });
});

describe('buildColumnStateMap', () => {
  it('builds a Map keyed by colId containing each column state entry', () => {
    const api = createMockApi(
      [],
      [
        { colId: 'col1', hide: false },
        { colId: 'col2', hide: true },
      ],
    );

    const map = buildColumnStateMap(api);

    expect(map.get('col1')).toEqual({ colId: 'col1', hide: false });
    expect(map.get('col2')).toEqual({ colId: 'col2', hide: true });
    expect(map.size).toBe(2);
  });
});

describe('mapColumnsToPanelItems', () => {
  it('maps a visible column to a checked panel item', () => {
    const api = createMockApi(
      [{ colId: 'col1', headerName: 'Column 1' }],
      [{ colId: 'col1', hide: false }],
    );

    const items = mapColumnsToPanelItems(api, DEFAULT_INCLUDE_COLUMN);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'col1',
      label: 'Column 1',
      isChecked: true,
      type: 'item',
    });
  });

  it('maps a hidden column to an unchecked panel item', () => {
    const api = createMockApi(
      [{ colId: 'col1', headerName: 'Column 1' }],
      [{ colId: 'col1', hide: true }],
    );

    const items = mapColumnsToPanelItems(api, DEFAULT_INCLUDE_COLUMN);

    expect(items[0]).toMatchObject({ isChecked: false });
  });

  it('excludes columns filtered out by the includeColumn predicate', () => {
    const api = createMockApi(
      [
        { colId: 'col1', headerName: 'Column 1' },
        {
          colId: 'col2',
          headerName: 'Column 2',
          suppressColumnsToolPanel: true,
        },
      ],
      [
        { colId: 'col1', hide: false },
        { colId: 'col2', hide: false },
      ],
    );

    const items = mapColumnsToPanelItems(api, DEFAULT_INCLUDE_COLUMN);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('col1');
  });

  it('sorts items according to their position in the current column state order', () => {
    const api = createMockApi(
      [
        { colId: 'colA', headerName: 'Column A' },
        { colId: 'colB', headerName: 'Column B' },
        { colId: 'colC', headerName: 'Column C' },
      ],
      [
        { colId: 'colC', hide: false },
        { colId: 'colA', hide: false },
        { colId: 'colB', hide: false },
      ],
    );

    const items = mapColumnsToPanelItems(api, DEFAULT_INCLUDE_COLUMN);

    expect(items.map((i) => i.id)).toEqual(['colC', 'colA', 'colB']);
  });

  it('excludes column defs that have neither a colId nor a field', () => {
    const api = createMockApi(
      [
        { headerName: 'No Id Column' },
        { colId: 'col1', headerName: 'Column 1' },
      ],
      [{ colId: 'col1', hide: false }],
    );

    const items = mapColumnsToPanelItems(api, DEFAULT_INCLUDE_COLUMN);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('col1');
  });
});

describe('getItemNodeByPath', () => {
  const nodes = [
    { id: 'item1', type: 'item' as const, label: 'Item 1', isChecked: true },
    {
      id: 'group1',
      type: 'group' as const,
      label: 'Group 1',
      items: [
        {
          id: 'item2',
          type: 'item' as const,
          label: 'Item 2',
          isChecked: true,
        },
      ],
    },
    {
      id: 'item3',
      type: 'item' as const,
      label: 'Item 3',
      isChecked: true,
      items: [
        {
          id: 'item4',
          type: 'item' as const,
          label: 'Item 4',
          isChecked: true,
        },
      ],
    },
  ] as any;

  it('returns a root-level item by a single-element path', () => {
    expect(getItemNodeByPath(nodes, ['item1'])?.id).toBe('item1');
  });

  it('traverses a group node to return a nested item', () => {
    expect(getItemNodeByPath(nodes, ['group1', 'item2'])?.id).toBe('item2');
  });

  it('traverses an item with sub-items to return a nested item', () => {
    expect(getItemNodeByPath(nodes, ['item3', 'item4'])?.id).toBe('item4');
  });

  it('returns undefined for a path segment that does not exist', () => {
    expect(getItemNodeByPath(nodes, ['nonexistent'])).toBeUndefined();
  });

  it('returns undefined when the path resolves to a group node', () => {
    expect(getItemNodeByPath(nodes, ['group1'])).toBeUndefined();
  });
});

describe('flattenIncludedLeafIds', () => {
  it('returns ids of flat item nodes in order', () => {
    const nodes = [
      { id: 'item1', type: 'item' as const, label: 'Item 1', isChecked: true },
      { id: 'item2', type: 'item' as const, label: 'Item 2', isChecked: true },
    ] as any;

    expect(flattenIncludedLeafIds(nodes)).toEqual(['item1', 'item2']);
  });

  it('recursively flattens items inside a group node', () => {
    const nodes = [
      {
        id: 'group1',
        type: 'group' as const,
        label: 'Group',
        items: [
          {
            id: 'item1',
            type: 'item' as const,
            label: 'Item 1',
            isChecked: true,
          },
          {
            id: 'item2',
            type: 'item' as const,
            label: 'Item 2',
            isChecked: true,
          },
        ],
      },
    ] as any;

    expect(flattenIncludedLeafIds(nodes)).toEqual(['item1', 'item2']);
  });

  it('stops at items where isLeaf returns true and descends into items where it returns false', () => {
    const nodes = [
      { id: 'item1', type: 'item' as const, label: 'Item 1', isChecked: true },
      {
        id: 'item2',
        type: 'item' as const,
        label: 'Item 2',
        isChecked: true,
        items: [
          {
            id: 'item3',
            type: 'item' as const,
            label: 'Item 3',
            isChecked: true,
          },
        ],
      },
    ] as any;

    const isLeaf = (node: any) => node.id === 'item1';

    expect(flattenIncludedLeafIds(nodes, isLeaf)).toEqual(['item1', 'item3']);
  });

  it("descends into an item's children when the item is not matched by isLeaf", () => {
    const nodes = [
      {
        id: 'parent',
        type: 'item' as const,
        label: 'Parent',
        isChecked: true,
        items: [
          {
            id: 'child1',
            type: 'item' as const,
            label: 'Child 1',
            isChecked: true,
          },
          {
            id: 'child2',
            type: 'item' as const,
            label: 'Child 2',
            isChecked: true,
          },
        ],
      },
    ] as any;

    expect(flattenIncludedLeafIds(nodes)).toEqual(['child1', 'child2']);
  });
});

describe('mergeIncludedOrderIntoFullOrder', () => {
  it('substitutes included columns in their new order while keeping excluded columns in place', () => {
    const fullOrder = ['excluded1', 'colA', 'excluded2', 'colB', 'colC'];
    const newIncludedOrder = ['colC', 'colA', 'colB'];
    const includedSet = new Set(['colA', 'colB', 'colC']);

    expect(
      mergeIncludedOrderIntoFullOrder(fullOrder, newIncludedOrder, includedSet),
    ).toEqual(['excluded1', 'colC', 'excluded2', 'colA', 'colB']);
  });

  it('returns the full order unchanged when the included set is empty', () => {
    const fullOrder = ['col1', 'col2', 'col3'];

    expect(mergeIncludedOrderIntoFullOrder(fullOrder, [], new Set())).toEqual(
      fullOrder,
    );
  });

  it('fully reorders when all columns are included', () => {
    const fullOrder = ['colA', 'colB', 'colC'];
    const newIncludedOrder = ['colC', 'colB', 'colA'];
    const includedSet = new Set(['colA', 'colB', 'colC']);

    expect(
      mergeIncludedOrderIntoFullOrder(fullOrder, newIncludedOrder, includedSet),
    ).toEqual(['colC', 'colB', 'colA']);
  });
});

describe('captureInitialColumnsState', () => {
  it('returns the current column state and group state from the api', () => {
    const columnState = [{ colId: 'col1', hide: false }];
    const columnGroupState = [{ groupId: 'group1', open: true }];
    const api = createMockApi([], columnState, columnGroupState);

    const state = captureInitialColumnsState(api);

    expect(state.columnState).toBe(columnState);
    expect(state.columnGroupState).toBe(columnGroupState);
  });
});

describe('restoreInitialColumnsState', () => {
  it('applies the saved column state and group state to the api', () => {
    const api = createMockApi();
    const initialState = {
      columnState: [{ colId: 'col1', hide: false }],
      columnGroupState: [{ groupId: 'group1', open: true }],
    };

    restoreInitialColumnsState(api, initialState);

    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: initialState.columnState,
      applyOrder: true,
    });
    expect(api.setColumnGroupState).toHaveBeenCalledWith(
      initialState.columnGroupState,
    );
  });

  it('does nothing when initialState is null or undefined', () => {
    const api = createMockApi();
    restoreInitialColumnsState(api, null);
    restoreInitialColumnsState(api, undefined);
    expect(api.applyColumnState).not.toHaveBeenCalled();
  });
});

describe('buildCrossDatasetEnrichItem', () => {
  const mockGetDimensionsScheme = jest.fn();
  const mockGetDimensionConfig = jest.fn();

  const baseInfo = {
    dataQueries: [{ urn: 'urn:test:dataset' }],
    structuresMap: new Map(),
    getDimensionsScheme: mockGetDimensionsScheme,
    getDimensionConfig: mockGetDimensionConfig,
    locale: 'en',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDimensions as jest.Mock).mockReturnValue({ dimensions: [] });
    (getDimensionTitle as jest.Mock).mockReturnValue(undefined);
    (getLocalizedName as jest.Mock).mockReturnValue('My Dataset');
  });

  it('returns the item unchanged for non-aggregated column ids', () => {
    const item = {
      id: 'some_other_col',
      type: 'item' as const,
      label: 'Other',
      isChecked: true,
    };
    const enrich = buildCrossDatasetEnrichItem(baseInfo);
    expect(enrich(item)).toBe(item);
  });

  it('returns the item unchanged when no dimension keys resolve for the column', () => {
    mockGetDimensionsScheme.mockReturnValue({ indicators: [] });
    const item = {
      id: INDICATOR_COL_ID,
      type: 'item' as const,
      label: 'Indicators',
      isChecked: true,
    };
    const enrich = buildCrossDatasetEnrichItem(baseInfo);
    expect(enrich(item)).toBe(item);
  });

  it('builds one group per dataQuery with leaf items using dimension aliases for INDICATOR_COL_ID', () => {
    mockGetDimensionsScheme.mockReturnValue({ indicators: ['DIM1', 'DIM2'] });
    mockGetDimensionConfig
      .mockReturnValueOnce({ alias: 'Alias DIM1' })
      .mockReturnValueOnce({ alias: 'Alias DIM2' });

    const item = {
      id: INDICATOR_COL_ID,
      type: 'item' as const,
      label: 'Indicators',
      isChecked: true,
    };
    const enrich = buildCrossDatasetEnrichItem(baseInfo);
    const result = enrich(item);

    expect(result.items).toHaveLength(1);
    const group = result.items![0] as any;
    expect(group.type).toBe('group');
    expect(group.label).toBe('My Dataset');
    expect(group.items).toHaveLength(2);
    expect(group.items[0]).toMatchObject({
      id: 'urn:test:dataset::DIM1',
      label: 'Alias DIM1',
    });
    expect(group.items[1]).toMatchObject({
      id: 'urn:test:dataset::DIM2',
      label: 'Alias DIM2',
    });
  });

  it('falls back to the dimension key as label when no alias or title is available', () => {
    mockGetDimensionsScheme.mockReturnValue({ indicators: ['DIM1'] });
    mockGetDimensionConfig.mockReturnValue(undefined);
    (getDimensions as jest.Mock).mockReturnValue({ dimensions: [] });
    (getDimensionTitle as jest.Mock).mockReturnValue(undefined);

    const item = {
      id: INDICATOR_COL_ID,
      type: 'item' as const,
      label: 'Indicators',
      isChecked: true,
    };
    const enrich = buildCrossDatasetEnrichItem(baseInfo);
    const result = enrich(item);

    expect((result.items![0] as any).items[0]).toMatchObject({ label: 'DIM1' });
  });

  it('builds a group for COUNTRY_COL_ID using the region dimension key', () => {
    mockGetDimensionsScheme.mockReturnValue({ region: 'REG' });
    mockGetDimensionConfig.mockReturnValue({ alias: 'Region' });

    const item = {
      id: COUNTRY_COL_ID,
      type: 'item' as const,
      label: 'Country',
      isChecked: true,
    };
    const enrich = buildCrossDatasetEnrichItem(baseInfo);
    const result = enrich(item);

    expect((result.items![0] as any).items[0]).toMatchObject({
      id: 'urn:test:dataset::REG',
      label: 'Region',
    });
  });

  it('creates one group per dataQuery when multiple datasets are provided', () => {
    const infoWithTwoQueries = {
      ...baseInfo,
      dataQueries: [{ urn: 'urn:dataset:A' }, { urn: 'urn:dataset:B' }],
    };
    mockGetDimensionsScheme.mockReturnValue({ indicators: ['DIM1'] });
    mockGetDimensionConfig.mockReturnValue({ alias: 'Dim' });

    const item = {
      id: INDICATOR_COL_ID,
      type: 'item' as const,
      label: 'Indicators',
      isChecked: true,
    };
    const enrich = buildCrossDatasetEnrichItem(infoWithTwoQueries);
    const result = enrich(item);

    expect(result.items).toHaveLength(2);
    expect((result.items![0] as any).id).toBe('urn:dataset:A');
    expect((result.items![1] as any).id).toBe('urn:dataset:B');
  });
});
