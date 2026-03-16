'use client';

import * as React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { IconDatabase } from '@tabler/icons-react';

import type {
  DraggableListItemNode,
  DraggableListNode,
  ItemClickEvent,
  ItemKey,
  ToggleCheckedEvent,
  ToggleExpandedEvent,
} from './types';
import { DraggableListOverlay } from './DraggableListOverlay';
import { DraggableListRow } from './DraggableListRow';
import {
  findItemNode,
  getSortableItemSiblings,
  itemKey,
  parseItemKey,
  updateItemsAtParent,
} from './utils/utils';

type ActiveDrag = {
  id: ItemKey;
  label: string;
  hasChildren: boolean;
  isChecked?: boolean;
  isExpanded?: boolean;
};

export interface DraggableListProps {
  items: DraggableListNode[];

  showDragHandle?: boolean;
  showCheckbox?: boolean;

  onItemsChange: (next: DraggableListNode[]) => void;

  onToggleExpanded?: (e: ToggleExpandedEvent) => void;
  onToggleChecked?: (e: ToggleCheckedEvent) => void;
  onItemClick?: (e: ItemClickEvent) => void;

  renderLabel?: (item: DraggableListItemNode) => React.ReactNode;

  ariaLabel?: string;
}

/**
 * DraggableList renders a hierarchical list of items that can be reordered
 * via drag and drop. Items may contain nested items and groups, allowing
 * complex tree-like structures such as column managers, dataset dimensions,
 * or configuration panels.
 *
 * Only nodes with `type: 'item'` are draggable and sortable. Nodes with
 * `type: 'group'` act as labeled containers and cannot be dragged.
 *
 * The component is fully controlled: state changes such as reordering,
 * checkbox toggles, or expansion are reported through callbacks and
 * should be handled by the parent component.
 *
 * @example
 * Basic usage
 * ```tsx
 * const [items, setItems] = useState<DraggableListNode[]>([
 *   { type: 'item', id: 'agency', label: 'Agency', isChecked: true },
 *   {
 *     type: 'group',
 *     id: 'indicator-group',
 *     label: 'Indicator dimensions',
 *     items: [
 *       {
 *         type: 'item',
 *         id: 'weo',
 *         label: 'World Economic Outlook',
 *         isExpanded: true,
 *         items: [
 *           { type: 'item', id: 'indicator', label: 'Indicator' },
 *           { type: 'item', id: 'scale', label: 'Scale' },
 *         ],
 *       },
 *     ],
 *   },
 * ]);
 *
 * <DraggableList
 *   items={items}
 *   onItemsChange={setItems}
 *   onToggleChecked={(e) => console.log(e)}
 *   onToggleExpanded={(e) => console.log(e)}
 * />
 * ```
 *
 * @param items - Hierarchical list of nodes to render. Nodes may be `item` or `group`.
 * @param showDragHandle - Whether the drag handle icon should be displayed for draggable items.
 * @param showCheckbox - Whether item checkboxes should be rendered.
 * @param onItemsChange - Called when items are reordered via drag and drop.
 * @param onToggleExpanded - Called when an item's expanded state changes.
 * @param onToggleChecked - Called when an item's checkbox state changes.
 * @param onItemClick - Called when the main item row is clicked.
 * @param renderLabel - Optional custom renderer for item labels.
 * @param ariaLabel - Optional accessible label for the drag-and-drop container.
 */
export function DraggableList({
  items,
  showDragHandle = true,
  showCheckbox = true,
  onItemsChange,
  onToggleExpanded,
  onToggleChecked,
  onItemClick,
  renderLabel,
  ariaLabel,
}: DraggableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [active, setActive] = React.useState<ActiveDrag | null>(null);

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    const parsed = parseItemKey(id);
    if (!parsed) return;

    const item = findItemNode(items, parsed.parentPath, parsed.itemId);
    if (!item || item.type !== 'item') return;

    setActive({
      id,
      label: item.label,
      hasChildren: !!item.items?.length,
      isChecked: item.isChecked,
      isExpanded: item.isExpanded,
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActive(null);

    const over = e.over;
    if (!over) return;

    const src = parseItemKey(String(e.active.id));
    const dst = parseItemKey(String(over.id));
    if (!src || !dst) return;

    if (src.parentPath.join('/') !== dst.parentPath.join('/')) return;

    const siblings = getSortableItemSiblings(items, src.parentPath);
    if (!siblings) return;

    const oldIndex = siblings.findIndex((x) => x.id === src.itemId);
    const newIndex = siblings.findIndex((x) => x.id === dst.itemId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const next = updateItemsAtParent(items, src.parentPath, (nodes) => {
      const sortableItems = nodes.filter(
        (node): node is DraggableListItemNode => node.type === 'item',
      );

      const moved = arrayMove(sortableItems, oldIndex, newIndex);

      let itemIndex = 0;

      return nodes.map((node) => {
        if (node.type !== 'item') return node;
        const nextNode = moved[itemIndex];
        itemIndex += 1;
        return nextNode;
      });
    });

    onItemsChange(next);
  };

  const renderNodes = (
    nodes: DraggableListNode[],
    parentPath: string[] = [],
  ): React.ReactNode => {
    const sortableIds = nodes
      .filter((node): node is DraggableListItemNode => node.type === 'item')
      .map((node) => itemKey(parentPath, node.id));

    return (
      <SortableContext
        items={sortableIds}
        strategy={verticalListSortingStrategy}
      >
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {nodes.map((node) => {
            if (node.type === 'group') {
              return (
                <li
                  key={node.id}
                  className="m-0 mt-2 first:mt-0 flex flex-col gap-2 p-0"
                >
                  <div className="text-neutrals-1000 h5 flex items-center gap-2 py-1">
                    <IconDatabase size={12} className="shrink-0" />
                    {node.label}
                  </div>

                  <div className="pl-2 border-l border-neutrals-600">
                    {renderNodes(node.items, [...parentPath, node.id])}
                  </div>
                </li>
              );
            }

            return (
              <li key={node.id} className="m-0 flex flex-col gap-2 p-0">
                <DraggableListRow
                  parentPath={parentPath}
                  item={node}
                  showDragHandle={showDragHandle}
                  showCheckbox={showCheckbox}
                  renderLabel={renderLabel}
                  onItemClick={onItemClick}
                  onToggleExpanded={onToggleExpanded}
                  onToggleChecked={onToggleChecked}
                />

                {node.items?.length && node.isExpanded ? (
                  <div className="pl-7">
                    {renderNodes(node.items, [...parentPath, node.id])}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </SortableContext>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      aria-label={ariaLabel}
    >
      <div className="flex flex-col">{renderNodes(items)}</div>

      <DragOverlay>
        {active ? (
          <DraggableListOverlay
            label={active.label}
            hasChildren={active.hasChildren}
            showDragHandle={showDragHandle}
            showCheckbox={showCheckbox}
            isChecked={active.isChecked}
            isExpanded={active.isExpanded}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
