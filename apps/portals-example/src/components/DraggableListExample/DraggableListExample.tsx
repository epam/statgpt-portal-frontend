'use client';

import { useCallback, useState } from 'react';
import {
  DraggableList,
  DraggableListNode,
  ItemClickEvent,
  ToggleCheckedEvent,
  ToggleExpandedEvent,
} from '@epam/statgpt-ui-components';

export default function DraggableListExample() {
  const [items, setItems] = useState<DraggableListNode[]>([
    {
      type: 'item',
      id: 'agency',
      label: 'Agency',
      isChecked: true,
    },
    {
      type: 'item',
      id: 'dataset',
      label: 'Dataset',
      isChecked: true,
    },
    {
      type: 'item',
      id: 'country-dimensions',
      label: 'Country dimensions',
      isChecked: true,
    },
    {
      type: 'item',
      id: 'indicator-dimensions',
      label: 'Indicator dimensions',
      isChecked: true,
      isExpanded: true,
      items: [
        {
          type: 'group',
          id: 'world-economic-outlook-group',
          label: 'World Economic Outlook (WEO)',
          items: [
            {
              type: 'item',
              id: 'indicator',
              label: 'Indicator',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'scale',
              label: 'Scale',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'unit-of-measure',
              label: 'Unit of measure',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'imf-group',
          label: 'IMF: Production Indexes, World and Country Group Aggregates',
          items: [
            {
              type: 'item',
              id: 'production-index',
              label: 'Production index',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'type-transaction',
              label: 'Type of Transformation',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'unit-of-measure',
              label: 'Unit of measure',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'gdp-group',
          label: 'GDP per capita in PPS',
          items: [
            {
              type: 'item',
              id: 'account-indicator',
              label: 'National account indicator',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'seasonal-adjustment',
              label: 'Seasonal adjustment',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'unit-of-measure',
              label: 'Unit of measure',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'frequency',
      label: 'Frequency',
      isChecked: true,
    },
    {
      type: 'item',
      id: 'time-period',
      label: 'Time period',
      isChecked: true,
    },
  ]);

  const handleToggleChecked = useCallback((e: ToggleCheckedEvent) => {
    setItems((prev) =>
      updateAtPath(prev, e.path, (node) => {
        if (node.type !== 'item') return node;

        return {
          ...node,
          isChecked: e.nextChecked,
        };
      }),
    );
  }, []);

  const handleToggleExpanded = useCallback((e: ToggleExpandedEvent) => {
    setItems((prev) =>
      updateAtPath(prev, e.path, (node) => {
        if (node.type !== 'item') return node;

        return {
          ...node,
          isExpanded: e.nextExpanded,
        };
      }),
    );
  }, []);

  const handleItemClick = useCallback((e: ItemClickEvent) => {
    setItems((prev) =>
      updateAtPath(prev, e.path, (node) => {
        if (node.type !== 'item') return node;

        const isDisabled = !!node.isDisabled;
        const checkable = isDisabled ? false : (node.checkable ?? true);

        if (!checkable) return node;

        return {
          ...node,
          isChecked: !node.isChecked,
        };
      }),
    );
  }, []);

  return (
    <div className="max-w-md p-4">
      <DraggableList
        items={items}
        onItemsChange={setItems}
        onToggleChecked={handleToggleChecked}
        onToggleExpanded={handleToggleExpanded}
        onItemClick={handleItemClick}
      />
    </div>
  );
}

function updateAtPath(
  nodes: DraggableListNode[],
  path: readonly string[],
  updater: (node: DraggableListNode) => DraggableListNode,
): DraggableListNode[] {
  if (path.length === 0) return nodes;

  const [head, ...tail] = path;

  return nodes.map((node) => {
    if (node.id !== head) return node;

    if (tail.length === 0) {
      return updater(node);
    }

    if (!node.items) return node;

    return {
      ...node,
      items: updateAtPath(node.items, tail, updater),
    };
  });
}
