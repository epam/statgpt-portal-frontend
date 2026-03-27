import type { ItemClickEvent } from '@epam/statgpt-ui-components';

jest.mock('@epam/statgpt-ui-components', () => ({
  filterDraggableListNodes: jest.fn((nodes: unknown[]) => nodes),
}));

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({}));

import { renderHook, act } from '@testing-library/react';
import { useAgGridColumnsPanel } from '../useAgGridColumnsPanel';
import type { GridApi } from 'ag-grid-community';

function createMockApi(
  columnDefs: any[] = [],
  columnState: any[] = [],
): GridApi {
  return {
    getColumnDefs: jest.fn().mockReturnValue(columnDefs),
    getColumnState: jest.fn().mockReturnValue(columnState),
    applyColumnState: jest.fn(),
    setColumnGroupState: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  } as unknown as GridApi;
}

describe('useAgGridColumnsPanel', () => {
  describe('handleToggleChecked', () => {
    it('hides a visible column when nextChecked is false', () => {
      const api = createMockApi(
        [{ colId: 'col1', headerName: 'Column 1' }],
        [{ colId: 'col1', hide: false }],
      );
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '' }),
      );

      act(() => {
        result.current.handleToggleChecked({
          itemId: 'col1',
          path: ['col1'],
          nextChecked: false,
        });
      });

      expect(api.applyColumnState).toHaveBeenCalledWith({
        state: [{ colId: 'col1', hide: true }],
      });
    });

    it('shows a hidden column when nextChecked is true', () => {
      const api = createMockApi(
        [{ colId: 'col1', headerName: 'Column 1' }],
        [{ colId: 'col1', hide: true }],
      );
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '' }),
      );

      act(() => {
        result.current.handleToggleChecked({
          itemId: 'col1',
          path: ['col1'],
          nextChecked: true,
        });
      });

      expect(api.applyColumnState).toHaveBeenCalledWith({
        state: [{ colId: 'col1', hide: false }],
      });
    });

    it('does nothing when the path does not match any known column', () => {
      const api = createMockApi(
        [{ colId: 'col1', headerName: 'Column 1' }],
        [{ colId: 'col1', hide: false }],
      );
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '' }),
      );

      act(() => {
        result.current.handleToggleChecked({
          itemId: 'col1',
          path: ['unknownCol'],
          nextChecked: false,
        });
      });

      expect(api.applyColumnState).not.toHaveBeenCalled();
    });
  });

  describe('handleItemClick', () => {
    it('hides a currently visible column when clicked', () => {
      const api = createMockApi(
        [{ colId: 'col1', headerName: 'Column 1' }],
        [{ colId: 'col1', hide: false }],
      );
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '' }),
      );

      act(() => {
        result.current.handleItemClick({
          itemId: 'col1',
          path: ['col1'],
        } as unknown as ItemClickEvent);
      });

      expect(api.applyColumnState).toHaveBeenCalledWith({
        state: [{ colId: 'col1', hide: true }],
      });
    });

    it('shows a currently hidden column when clicked', () => {
      const api = createMockApi(
        [{ colId: 'col1', headerName: 'Column 1' }],
        [{ colId: 'col1', hide: true }],
      );
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '' }),
      );

      act(() => {
        result.current.handleItemClick({
          itemId: 'col1',
          path: ['col1'],
        } as unknown as ItemClickEvent);
      });

      expect(api.applyColumnState).toHaveBeenCalledWith({
        state: [{ colId: 'col1', hide: false }],
      });
    });

    it('does nothing when the path does not match any known column', () => {
      const api = createMockApi(
        [{ colId: 'col1', headerName: 'Column 1' }],
        [{ colId: 'col1', hide: false }],
      );
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '' }),
      );

      act(() => {
        result.current.handleItemClick({
          itemId: 'unknownCol',
          path: ['unknownCol'],
        } as unknown as ItemClickEvent);
      });

      expect(api.applyColumnState).not.toHaveBeenCalled();
    });
  });

  describe('handleToggleExpanded', () => {
    function makeApiWithEnrichedItem() {
      const api = createMockApi(
        [{ colId: 'col1', headerName: 'Column 1' }],
        [{ colId: 'col1', hide: false }],
      );
      const enrichItem = (item: any) =>
        item.id === 'col1'
          ? {
              ...item,
              items: [
                { id: 'child', type: 'item', label: 'Child', isChecked: true },
              ],
            }
          : item;
      return { api, enrichItem };
    }

    it('marks an item as collapsed when nextExpanded is false', () => {
      const { api, enrichItem } = makeApiWithEnrichedItem();
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '', enrichItem }),
      );

      expect((result.current.visibleItems[0] as any).isExpanded).toBe(true);

      act(() => {
        result.current.handleToggleExpanded({
          itemId: 'col1',
          path: ['col1'],
          nextExpanded: false,
        });
      });

      expect((result.current.visibleItems[0] as any).isExpanded).toBe(false);
    });

    it('marks an item as expanded again after being collapsed', () => {
      const { api, enrichItem } = makeApiWithEnrichedItem();
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '', enrichItem }),
      );

      act(() => {
        result.current.handleToggleExpanded({
          itemId: 'col1',
          path: ['col1'],
          nextExpanded: false,
        });
      });

      act(() => {
        result.current.handleToggleExpanded({
          itemId: 'col1',
          path: ['col1'],
          nextExpanded: true,
        });
      });

      expect((result.current.visibleItems[0] as any).isExpanded).toBe(true);
    });
  });

  describe('handleItemsChange', () => {
    it('applies the merged new column order to the grid', () => {
      const api = createMockApi(
        [
          { colId: 'colA', headerName: 'Column A' },
          { colId: 'colB', headerName: 'Column B' },
          { colId: 'colC', headerName: 'Column C' },
        ],
        [
          { colId: 'colA', hide: false },
          { colId: 'colB', hide: false },
          { colId: 'colC', hide: false },
        ],
      );
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '' }),
      );

      const newOrder = [
        {
          id: 'colC',
          type: 'item' as const,
          label: 'Column C',
          isChecked: true,
        },
        {
          id: 'colA',
          type: 'item' as const,
          label: 'Column A',
          isChecked: true,
        },
        {
          id: 'colB',
          type: 'item' as const,
          label: 'Column B',
          isChecked: true,
        },
      ];

      act(() => {
        result.current.handleItemsChange(newOrder as any);
      });

      expect(api.applyColumnState).toHaveBeenCalledWith({
        state: [{ colId: 'colC' }, { colId: 'colA' }, { colId: 'colB' }],
        applyOrder: true,
      });
    });

    it('preserves excluded columns in their original positions when panel items are reordered', () => {
      const api = createMockApi(
        [
          { colId: 'colA', headerName: 'Column A' },
          {
            colId: 'hiddenCol',
            headerName: 'Hidden',
            suppressColumnsToolPanel: true,
          },
          { colId: 'colB', headerName: 'Column B' },
        ],
        [
          { colId: 'colA', hide: false },
          { colId: 'hiddenCol', hide: false },
          { colId: 'colB', hide: false },
        ],
      );
      const { result } = renderHook(() =>
        useAgGridColumnsPanel({ api, searchQuery: '' }),
      );

      const newOrder = [
        {
          id: 'colB',
          type: 'item' as const,
          label: 'Column B',
          isChecked: true,
        },
        {
          id: 'colA',
          type: 'item' as const,
          label: 'Column A',
          isChecked: true,
        },
      ];

      act(() => {
        result.current.handleItemsChange(newOrder as any);
      });

      expect(api.applyColumnState).toHaveBeenCalledWith({
        state: [{ colId: 'colB' }, { colId: 'hiddenCol' }, { colId: 'colA' }],
        applyOrder: true,
      });
    });
  });
});
