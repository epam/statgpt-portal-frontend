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
import type { ColumnPanelFilter } from '../types';
import {
  DEFAULT_INCLUDE_COLUMN,
  mapColumnsToPanelItems,
  mergeIncludedOrderIntoFullOrder,
} from '../helpers/columnPanelMapping';
import {
  flattenIncludedLeafIds,
  getItemNodeByPath,
} from '../helpers/draggableListUtils';
import {
  isDimensionSubItemId,
  parseDimensionSubItemId,
} from '../../helpers/dimensionSubItemId';
import { GridApi } from 'ag-grid-community';
import { useAgGridColumnGridListeners } from './useAgGridColumnGridListeners';

/**
 * Manages column panel state for an AG Grid instance, deriving a draggable item
 * tree from the grid's column state and returning handlers for toggling visibility,
 * reordering columns, and expanding or collapsing grouped entries.
 */
export function useAgGridColumnsPanel({
  api,
  searchQuery,
  includeColumn = DEFAULT_INCLUDE_COLUMN,
  enrichItem,
  onSubItemOrderChange,
  onSubItemVisibilityChange,
}: {
  api: GridApi | null;
  searchQuery: string;
  includeColumn?: ColumnPanelFilter;
  enrichItem?: (item: DraggableListItemNode) => DraggableListItemNode;
  onSubItemOrderChange?: (urn: string, colId: string, order: string[]) => void;
  onSubItemVisibilityChange?: (
    urn: string,
    colId: string,
    dimensionKey: string,
    hidden: boolean,
  ) => void;
}) {
  const [gridStateVersion, setGridStateVersion] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
        ? { ...node, isExpanded: expandedIds.has(node.id) }
        : node,
    );
  }, [rawItems, enrichItem, expandedIds]);

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

      if (isDimensionSubItemId(e.itemId) && onSubItemVisibilityChange) {
        const { urn, dimensionKey } = parseDimensionSubItemId(e.itemId);
        const colId = e.path[0];
        onSubItemVisibilityChange(urn, colId, dimensionKey, !e.nextChecked);
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
    [api, items, knownColumnIds, syncFromGrid, onSubItemVisibilityChange],
  );

  const handleItemClick = useCallback(
    (e: ItemClickEvent) => {
      if (!api) {
        return;
      }

      if (isDimensionSubItemId(e.itemId) && onSubItemVisibilityChange) {
        const { urn, dimensionKey } = parseDimensionSubItemId(e.itemId);
        const colId = e.path[0];
        const node = getItemNodeByPath(items, e.path);
        if (node?.type === 'item') {
          onSubItemVisibilityChange(
            urn,
            colId,
            dimensionKey,
            node.isChecked ?? true,
          );
        }
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
    [api, items, knownColumnIds, syncFromGrid, onSubItemVisibilityChange],
  );

  const handleToggleExpanded = useCallback((e: ToggleExpandedEvent) => {
    const nodeId = e.path[e.path.length - 1];

    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (e.nextExpanded) {
        next.add(nodeId);
      } else {
        next.delete(nodeId);
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

      if (onSubItemOrderChange) {
        for (const topNode of next) {
          if (
            topNode.type !== 'item' ||
            !knownColumnIds.has(topNode.id) ||
            !topNode.items
          ) {
            continue;
          }
          for (const groupNode of topNode.items) {
            if (groupNode.type !== 'group') continue;
            const leafItems = groupNode.items.filter(
              (i): i is DraggableListItemNode => i.type === 'item',
            );
            if (leafItems.length <= 1) continue;
            const urn = groupNode.id;
            const newOrder = leafItems.map(
              (i) => parseDimensionSubItemId(i.id).dimensionKey,
            );
            onSubItemOrderChange(urn, topNode.id, newOrder);
          }
        }
      }
    },
    [api, rawItems, knownColumnIds, syncFromGrid, onSubItemOrderChange],
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
