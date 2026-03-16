'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  filterDraggableListNodes,
  type DraggableListNode,
  type ItemClickEvent,
  type ToggleCheckedEvent,
  type ToggleExpandedEvent,
} from '@epam/statgpt-ui-components';
import type { ColumnPanelFilter } from './types';
import {
  DEFAULT_INCLUDE_COLUMN,
  flattenIncludedLeafIds,
  getItemNodeByPath,
  mapColumnsToPanelItems,
  mergeIncludedOrderIntoFullOrder,
} from './helpers';
import { GridApi } from 'ag-grid-community';

export function useAgGridColumnsPanel({
  api,
  searchQuery,
  includeColumn = DEFAULT_INCLUDE_COLUMN,
}: {
  api: GridApi | null;
  searchQuery: string;
  includeColumn?: ColumnPanelFilter;
}) {
  const [gridStateVersion, setGridStateVersion] = useState(0);

  const syncFromGrid = useCallback(() => {
    setGridStateVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    const listener = syncFromGrid;

    api.addEventListener('columnVisible', listener);
    api.addEventListener('columnMoved', listener);
    api.addEventListener('displayedColumnsChanged', listener);
    api.addEventListener('newColumnsLoaded', listener);
    api.addEventListener('gridColumnsChanged', listener);
    api.addEventListener('columnPinned', listener);

    return () => {
      api.removeEventListener('columnVisible', listener);
      api.removeEventListener('columnMoved', listener);
      api.removeEventListener('displayedColumnsChanged', listener);
      api.removeEventListener('newColumnsLoaded', listener);
      api.removeEventListener('gridColumnsChanged', listener);
      api.removeEventListener('columnPinned', listener);
    };
  }, [api, syncFromGrid]);

  const items = useMemo(() => {
    if (!api) {
      return [];
    }

    return mapColumnsToPanelItems(api, includeColumn);
  }, [api, includeColumn, gridStateVersion]);

  const visibleItems = useMemo(() => {
    return filterDraggableListNodes(items, searchQuery);
  }, [items, searchQuery]);

  const handleToggleChecked = useCallback(
    (e: ToggleCheckedEvent) => {
      if (!api) {
        return;
      }

      const node = getItemNodeByPath(items, e.path);

      if (!node) {
        return;
      }

      api.applyColumnState({
        state: [{ colId: node.id, hide: !e.nextChecked }],
      });

      syncFromGrid();
    },
    [api, items, syncFromGrid],
  );

  const handleItemClick = useCallback(
    (e: ItemClickEvent) => {
      if (!api) {
        return;
      }

      const node = getItemNodeByPath(items, e.path);

      if (!node) {
        return;
      }

      const currentState = api
        .getColumnState()
        .find((state) => state.colId === node.id);

      const isVisible = !(currentState?.hide ?? false);

      api.applyColumnState({
        state: [{ colId: node.id, hide: isVisible }],
      });

      syncFromGrid();
    },
    [api, items, syncFromGrid],
  );

  const handleToggleExpanded = useCallback((_e: ToggleExpandedEvent) => {
    // Reserved for future grouped columns support.
  }, []);

  const handleItemsChange = useCallback(
    (next: DraggableListNode[]) => {
      if (!api) {
        return;
      }

      const fullCurrentOrder = api.getColumnState().map((state) => state.colId);
      const includedCurrentIds = new Set(items.map((item) => item.id));
      const nextIncludedOrder = flattenIncludedLeafIds(next);

      const mergedOrder = mergeIncludedOrderIntoFullOrder(
        fullCurrentOrder,
        nextIncludedOrder,
        includedCurrentIds,
      );

      api.applyColumnState({
        state: mergedOrder.map((colId) => ({ colId })),
        applyOrder: true,
      });

      syncFromGrid();
    },
    [api, items, syncFromGrid],
  );

  return {
    items,
    visibleItems,
    handleToggleChecked,
    handleToggleExpanded,
    handleItemClick,
    handleItemsChange,
  };
}
