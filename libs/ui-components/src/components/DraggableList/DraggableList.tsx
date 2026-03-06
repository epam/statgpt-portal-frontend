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
import type {
  DraggableListItem,
  DraggableListSection,
  ItemClickEvent,
  ToggleCheckedEvent,
  ToggleExpandedEvent,
} from './types';
import { DraggableListOverlay } from './DraggableListOverlay';
import { DraggableListRow } from './DraggableListRow';
import {
  findItem,
  getSiblings,
  itemKey,
  parseItemKey,
  updateItemsAtParent,
} from './utils';
import { IconDatabase } from '@tabler/icons-react';

type ItemKey = string;

type ActiveDrag = {
  id: ItemKey;
  label: string;
  hasChildren: boolean;
  isChecked?: boolean;
  isExpanded?: boolean;
};

export interface DraggableListProps {
  sections: DraggableListSection[];

  showDragHandle?: boolean;
  showCheckbox?: boolean;

  onSectionsChange: (next: DraggableListSection[]) => void;

  onToggleExpanded?: (e: ToggleExpandedEvent) => void;
  onToggleChecked?: (e: ToggleCheckedEvent) => void;
  onItemClick?: (e: ItemClickEvent) => void;

  renderLabel?: (item: DraggableListItem) => React.ReactNode;

  ariaLabel?: string;
}

export function DraggableList({
  sections,
  showDragHandle = true,
  showCheckbox = true,
  onSectionsChange,
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

    const item = findItem(
      sections,
      parsed.sectionId,
      parsed.parentPath,
      parsed.itemId,
    );

    setActive({
      id,
      label: item?.label ?? parsed.itemId,
      hasChildren: !!item?.items?.length,
      isChecked: item?.isChecked,
      isExpanded: item?.isExpanded,
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActive(null);

    const over = e.over;
    if (!over) return;

    const src = parseItemKey(String(e.active.id));
    const dst = parseItemKey(String(over.id));
    if (!src || !dst) return;

    if (src.sectionId !== dst.sectionId) return;
    if (src.parentPath.join('/') !== dst.parentPath.join('/')) return;

    const siblings = getSiblings(sections, src.sectionId, src.parentPath);
    if (!siblings) return;

    const oldIndex = siblings.findIndex((x) => x.id === src.itemId);
    const newIndex = siblings.findIndex((x) => x.id === dst.itemId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const next = updateItemsAtParent(
      sections,
      src.sectionId,
      src.parentPath,
      (items) => arrayMove(items, oldIndex, newIndex),
    );

    onSectionsChange(next);
  };

  const renderItems = (
    sectionId: string,
    items: DraggableListItem[],
    parentPath: string[] = [],
  ) => {
    const ids = items.map((it) => itemKey(sectionId, parentPath, it.id));

    return (
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="m-0 list-none p-0 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="m-0 p-0 flex flex-col gap-2">
              <DraggableListRow
                sectionId={sectionId}
                parentPath={parentPath}
                item={item}
                showDragHandle={showDragHandle}
                showCheckbox={showCheckbox}
                renderLabel={renderLabel}
                onItemClick={onItemClick}
                onToggleExpanded={onToggleExpanded}
                onToggleChecked={onToggleChecked}
              />
              {item.items?.length && item.isExpanded ? (
                <div className="pl-4">
                  {renderItems(sectionId, item.items, [...parentPath, item.id])}
                </div>
              ) : null}
            </li>
          ))}
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
      <div className="flex flex-col">
        {sections.map((s) => (
          <section key={s.id}>
            {s.type === 'group' ? (
              <div className="h5 text-neutrals-1000 flex gap-2 items-center">
                <IconDatabase size={12} />
                {s.title}
              </div>
            ) : null}
            {renderItems(s.id, s.items)}
          </section>
        ))}
      </div>

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
