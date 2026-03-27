import { act, renderHook } from '@testing-library/react';
import type { ColDef, GridApi } from 'ag-grid-community';
import type {
  DraggableListItemNode,
  DraggableListNode,
  ItemClickEvent,
  ToggleCheckedEvent,
  ToggleExpandedEvent,
} from '@epam/statgpt-ui-components';
import { useAgGridColumnsPanel } from '../useAgGridColumnsPanel';
import { buildDimensionSubItemId } from '../../../helpers/dimensionSubItemId';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockApi(
  defs: ColDef[],
  state: { colId: string; hide?: boolean }[],
  overrides: Record<string, jest.Mock> = {},
): GridApi {
  return {
    getColumnDefs: jest.fn().mockReturnValue(defs),
    getColumnState: jest.fn().mockReturnValue(state),
    applyColumnState: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    ...overrides,
  } as unknown as GridApi;
}

const DEFS: ColDef[] = [
  { colId: 'name', headerName: 'Name' },
  { colId: 'price', headerName: 'Price' },
];
const STATE = [
  { colId: 'name', hide: false },
  { colId: 'price', hide: true },
];

function toggleChecked(
  itemId: string,
  path: string[],
  nextChecked: boolean,
): ToggleCheckedEvent {
  return { itemId, path, nextChecked };
}

function toggleExpanded(
  itemId: string,
  path: string[],
  nextExpanded: boolean,
): ToggleExpandedEvent {
  return { itemId, path, nextExpanded };
}

// ---------------------------------------------------------------------------
// items
// ---------------------------------------------------------------------------

describe('useAgGridColumnsPanel — items', () => {
  it('returns empty items when api is null', () => {
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api: null, searchQuery: '' }),
    );
    expect(result.current.items).toEqual([]);
  });

  it('maps one item per column def in column-state order', () => {
    const api = mockApi(DEFS, STATE);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '' }),
    );
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.map((i) => i.id)).toEqual(['name', 'price']);
  });

  it('applies enrichItem to each top-level item node', () => {
    const api = mockApi(DEFS, STATE);
    const enrichItem = jest.fn((item: DraggableListItemNode) => ({
      ...item,
      label: item.label + ' (enriched)',
    }));

    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '', enrichItem }),
    );

    expect(result.current.items[0].label).toBe('Name (enriched)');
    expect(result.current.items[1].label).toBe('Price (enriched)');
  });
});

// ---------------------------------------------------------------------------
// visibleItems
// ---------------------------------------------------------------------------

describe('useAgGridColumnsPanel — visibleItems', () => {
  it('returns all items when searchQuery is empty', () => {
    const api = mockApi(DEFS, STATE);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '' }),
    );
    expect(result.current.visibleItems).toHaveLength(2);
  });

  it('filters items by label (case-insensitive)', () => {
    const api = mockApi(DEFS, STATE);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: 'nam' }),
    );
    expect(result.current.visibleItems).toHaveLength(1);
    expect(result.current.visibleItems[0].id).toBe('name');
  });

  it('returns empty array when no items match searchQuery', () => {
    const api = mockApi(DEFS, STATE);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: 'zzz' }),
    );
    expect(result.current.visibleItems).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// handleToggleChecked
// ---------------------------------------------------------------------------

describe('useAgGridColumnsPanel — handleToggleChecked', () => {
  it('hides a column when nextChecked is false', () => {
    const api = mockApi(DEFS, STATE);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '' }),
    );

    act(() => {
      result.current.handleToggleChecked(
        toggleChecked('name', ['name'], false),
      );
    });

    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: 'name', hide: true }],
    });
  });

  it('shows a column when nextChecked is true', () => {
    const api = mockApi(DEFS, STATE);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '' }),
    );

    act(() => {
      result.current.handleToggleChecked(
        toggleChecked('price', ['price'], true),
      );
    });

    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: 'price', hide: false }],
    });
  });

  it('is a no-op when api is null', () => {
    const onSubItemVisibilityChange = jest.fn();
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({
        api: null,
        searchQuery: '',
        onSubItemVisibilityChange,
      }),
    );

    act(() => {
      result.current.handleToggleChecked(
        toggleChecked('name', ['name'], false),
      );
    });

    expect(onSubItemVisibilityChange).not.toHaveBeenCalled();
  });

  it('calls onSubItemVisibilityChange for a dimension sub-item id', () => {
    const api = mockApi(DEFS, STATE);
    const onSubItemVisibilityChange = jest.fn();
    const subItemId = buildDimensionSubItemId('urn:dataset1', 'IND1');

    const { result } = renderHook(() =>
      useAgGridColumnsPanel({
        api,
        searchQuery: '',
        onSubItemVisibilityChange,
      }),
    );

    act(() => {
      result.current.handleToggleChecked(
        toggleChecked(subItemId, ['indicator_col'], false),
      );
    });

    // hidden = !nextChecked = !false = true
    expect(onSubItemVisibilityChange).toHaveBeenCalledWith(
      'urn:dataset1',
      'indicator_col',
      'IND1',
      true,
    );
    expect(api.applyColumnState).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleToggleExpanded
// ---------------------------------------------------------------------------

describe('useAgGridColumnsPanel — handleToggleExpanded', () => {
  // enrichItem gives 'name' a sub-items array so isExpanded is tracked
  function enrichWithChildren(
    item: DraggableListItemNode,
  ): DraggableListItemNode {
    if (item.id === 'name') {
      return {
        ...item,
        items: [{ type: 'item', id: 'child1', label: 'Child' }],
      };
    }
    return item;
  }

  it('collapses an item when nextExpanded is false', () => {
    const api = mockApi(DEFS, STATE);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({
        api,
        searchQuery: '',
        enrichItem: enrichWithChildren,
      }),
    );

    // Initially not collapsed → isExpanded should be true
    const nameBefore = result.current.items.find((i) => i.id === 'name');
    expect((nameBefore as DraggableListItemNode).isExpanded).toBe(true);

    act(() => {
      result.current.handleToggleExpanded(
        toggleExpanded('name', ['name'], false),
      );
    });

    const nameAfter = result.current.items.find((i) => i.id === 'name');
    expect((nameAfter as DraggableListItemNode).isExpanded).toBe(false);
  });

  it('expands a previously collapsed item when nextExpanded is true', () => {
    const api = mockApi(DEFS, STATE);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({
        api,
        searchQuery: '',
        enrichItem: enrichWithChildren,
      }),
    );

    act(() => {
      result.current.handleToggleExpanded(
        toggleExpanded('name', ['name'], false),
      );
    });
    act(() => {
      result.current.handleToggleExpanded(
        toggleExpanded('name', ['name'], true),
      );
    });

    const name = result.current.items.find((i) => i.id === 'name');
    expect((name as DraggableListItemNode).isExpanded).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// handleItemsChange
// ---------------------------------------------------------------------------

describe('useAgGridColumnsPanel — handleItemsChange', () => {
  it('calls applyColumnState with the merged column order', () => {
    const api = mockApi(DEFS, STATE);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '' }),
    );

    const reordered: DraggableListNode[] = [
      { type: 'item', id: 'price', label: 'Price' },
      { type: 'item', id: 'name', label: 'Name' },
    ];

    act(() => {
      result.current.handleItemsChange(reordered);
    });

    expect(api.applyColumnState).toHaveBeenCalledWith(
      expect.objectContaining({ applyOrder: true }),
    );

    const stateArg: { colId: string }[] = (api.applyColumnState as jest.Mock)
      .mock.calls[0][0].state;
    expect(stateArg.map((s) => s.colId)).toEqual(['price', 'name']);
  });

  it('is a no-op when api is null', () => {
    const onSubItemOrderChange = jest.fn();
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({
        api: null,
        searchQuery: '',
        onSubItemOrderChange,
      }),
    );

    act(() => {
      result.current.handleItemsChange([
        { type: 'item', id: 'name', label: 'Name' },
      ]);
    });

    expect(onSubItemOrderChange).not.toHaveBeenCalled();
  });

  it('calls onSubItemOrderChange for a group with more than one leaf', () => {
    const api = mockApi(DEFS, STATE);
    const onSubItemOrderChange = jest.fn();
    const urn = 'urn:dataset1';

    const next: DraggableListNode[] = [
      {
        type: 'item',
        id: 'name',
        label: 'Name',
        items: [
          {
            type: 'group',
            id: urn,
            label: 'Dataset 1',
            items: [
              {
                type: 'item',
                id: buildDimensionSubItemId(urn, 'IND2'),
                label: 'IND2',
              },
              {
                type: 'item',
                id: buildDimensionSubItemId(urn, 'IND1'),
                label: 'IND1',
              },
            ],
          },
        ],
      },
      { type: 'item', id: 'price', label: 'Price' },
    ];

    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '', onSubItemOrderChange }),
    );

    act(() => {
      result.current.handleItemsChange(next);
    });

    expect(onSubItemOrderChange).toHaveBeenCalledWith(urn, 'name', [
      'IND2',
      'IND1',
    ]);
  });

  it('does not call onSubItemOrderChange for a group with only one leaf', () => {
    const api = mockApi(DEFS, STATE);
    const onSubItemOrderChange = jest.fn();
    const urn = 'urn:dataset1';

    const next: DraggableListNode[] = [
      {
        type: 'item',
        id: 'name',
        label: 'Name',
        items: [
          {
            type: 'group',
            id: urn,
            label: 'Dataset 1',
            items: [
              {
                type: 'item',
                id: buildDimensionSubItemId(urn, 'IND1'),
                label: 'IND1',
              },
            ],
          },
        ],
      },
    ];

    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '', onSubItemOrderChange }),
    );

    act(() => {
      result.current.handleItemsChange(next);
    });

    expect(onSubItemOrderChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleItemClick
// ---------------------------------------------------------------------------

describe('useAgGridColumnsPanel — handleItemClick', () => {
  it('hides a currently visible column', () => {
    const api = mockApi(DEFS, [
      { colId: 'name', hide: false },
      { colId: 'price' },
    ]);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '' }),
    );

    act(() => {
      result.current.handleItemClick({
        itemId: 'name',
        path: ['name'],
        nativeEvent: {} as unknown as ItemClickEvent['nativeEvent'],
      } as ItemClickEvent);
    });

    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: 'name', hide: true }],
    });
  });

  it('shows a currently hidden column', () => {
    const api = mockApi(DEFS, [
      { colId: 'name', hide: false },
      { colId: 'price', hide: true },
    ]);
    const { result } = renderHook(() =>
      useAgGridColumnsPanel({ api, searchQuery: '' }),
    );

    act(() => {
      result.current.handleItemClick({
        itemId: 'price',
        path: ['price'],
        nativeEvent: {} as unknown as ItemClickEvent['nativeEvent'],
      } as ItemClickEvent);
    });

    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: 'price', hide: false }],
    });
  });
});
