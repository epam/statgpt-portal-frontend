'use client';

import { useCallback, useState } from 'react';
import {
  DraggableList,
  DraggableListSection,
  ItemClickEvent,
  ToggleCheckedEvent,
  ToggleExpandedEvent,
  DraggableListItem,
} from '@epam/statgpt-ui-components';

export default function DraggableListExample() {
  const [sections, setSections] = useState<DraggableListSection[]>([
    {
      type: 'items',
      id: 'top',
      items: [
        { id: 'agency', label: 'Agency', isChecked: true },
        { id: 'dataset', label: 'Dataset', isChecked: true },
        { id: 'country', label: 'Country dimensions', isChecked: true },
      ],
    },
    {
      type: 'group',
      id: 'indicator-group',
      title: 'Indicator dimensions',
      items: [
        {
          id: 'weo',
          label: 'World Economic Outlook (WEO)',
          isExpanded: true,
          items: [
            { id: 'indicator', label: 'Indicator', isChecked: true },
            { id: 'scale', label: 'Scale', isChecked: true },
            { id: 'unit', label: 'Unit of measure', isChecked: true },
          ],
        },
        {
          id: 'imf',
          label: 'IMF: Production Indexes',
          isExpanded: true,
          items: [
            { id: 'prod-index', label: 'Production index', isChecked: true },
            {
              id: 'transform',
              label: 'Type of Transformation',
              isChecked: true,
            },
            { id: 'unit2', label: 'Unit of measure', isChecked: true },
          ],
        },
      ],
    },
  ]);

  const handleToggleChecked = useCallback((e: ToggleCheckedEvent) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        items: updateAtPath(section.items, e.path, (node) => ({
          ...node,
          isChecked: e.nextChecked,
        })),
      })),
    );
  }, []);

  const handleToggleExpanded = useCallback((e: ToggleExpandedEvent) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        items: updateAtPath(section.items, e.path, (node) => ({
          ...node,
          isExpanded: e.nextExpanded,
        })),
      })),
    );
  }, []);

  const handleItemClick = useCallback((e: ItemClickEvent) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        items: updateAtPath(section.items, e.path, (node) => {
          const isDisabled = !!node.isDisabled;
          const checkable = isDisabled ? false : (node.checkable ?? true);
          if (!checkable) return node;

          return { ...node, isChecked: !node.isChecked };
        }),
      })),
    );
  }, []);

  return (
    <div className="max-w-md p-4">
      <DraggableList
        sections={sections}
        onSectionsChange={setSections}
        onToggleChecked={handleToggleChecked}
        onToggleExpanded={handleToggleExpanded}
        onItemClick={handleItemClick}
      />
    </div>
  );
}

function updateAtPath(
  items: DraggableListItem[],
  path: readonly string[],
  updater: (node: DraggableListItem) => DraggableListItem,
): DraggableListItem[] {
  if (path.length === 0) return items;

  const [head, ...tail] = path;

  return items.map((it) => {
    if (it.id !== head) return it;

    if (tail.length === 0) {
      return updater(it);
    }

    return {
      ...it,
      items: updateAtPath(it.items ?? [], tail, updater),
    };
  });
}
