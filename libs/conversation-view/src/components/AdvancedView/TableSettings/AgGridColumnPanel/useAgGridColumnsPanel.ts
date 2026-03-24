'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  filterDraggableListNodes,
  type DraggableListItemNode,
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
import { useAgGridColumnGridListeners } from './useAgGridColumnGridListeners';

export function useAgGridColumnsPanel({
  api,
  searchQuery,
  includeColumn = DEFAULT_INCLUDE_COLUMN,
  enrichItem,
}: {
  api: GridApi | null;
  searchQuery: string;
  includeColumn?: ColumnPanelFilter;
  enrichItem?: (item: DraggableListItemNode) => DraggableListItemNode;
}) {
  const [gridStateVersion, setGridStateVersion] = useState(0);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const syncFromGrid = useCallback(() => {
    setGridStateVersion((value) => value + 1);
  }, []);

  useAgGridColumnGridListeners(api, syncFromGrid);

  const rawItems = useMemo(() => {
    if (!api || !api.getColumnState()) {
      return [];
    }

    return mapColumnsToPanelItems(api, includeColumn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, includeColumn, gridStateVersion]);

  const items = useMemo(() => {
    const base = enrichItem
      ? rawItems.map((node) => (node.type === 'item' ? enrichItem(node) : node))
      : rawItems;

    return base.map((node) =>
      node.type === 'item' && node.items?.length
        ? { ...node, isExpanded: !collapsedIds.has(node.id) }
        : node,
    );
  }, [rawItems, enrichItem, collapsedIds]);

  const knownColumnIds = useMemo(
    () => new Set(rawItems.map((i) => i.id)),
    [rawItems],
  );

  const visibleItems = useMemo(() => {
    return filterDraggableListNodes(items, searchQuery);
  }, [items, searchQuery]);

  const handleToggleChecked = useCallback(
    (e: ToggleCheckedEvent) => {
      if (!api) {
        return;
      }

      const node = getItemNodeByPath(items, e.path);

      if (!node || !knownColumnIds.has(node.id)) {
        return;
      }

      api.applyColumnState({
        state: [{ colId: node.id, hide: !e.nextChecked }],
      });

      syncFromGrid();
    },
    [api, items, knownColumnIds, syncFromGrid],
  );

  const handleItemClick = useCallback(
    (e: ItemClickEvent) => {
      if (!api) {
        return;
      }

      const node = getItemNodeByPath(items, e.path);

      if (!node || !knownColumnIds.has(node.id)) {
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
    [api, items, knownColumnIds, syncFromGrid],
  );

  const handleToggleExpanded = useCallback((e: ToggleExpandedEvent) => {
    const nodeId = e.path[e.path.length - 1];

    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (e.nextExpanded) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleItemsChange = useCallback(
    (next: DraggableListNode[]) => {
      if (!api) {
        return;
      }

      const fullCurrentOrder = api.getColumnState().map((state) => state.colId);
      const includedCurrentIds = new Set(rawItems.map((item) => item.id));
      const nextIncludedOrder = flattenIncludedLeafIds(next, (node) =>
        knownColumnIds.has(node.id),
      );

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
    [api, rawItems, knownColumnIds, syncFromGrid],
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
