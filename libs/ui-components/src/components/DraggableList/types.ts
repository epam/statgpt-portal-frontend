import { MouseEvent } from 'react';

export type TreePath = readonly string[];

export interface DraggableListItem {
  id: string;
  label: string;
  items?: DraggableListItem[];
  isExpanded?: boolean;
  isChecked?: boolean;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  draggable?: boolean;
  checkable?: boolean;
}

export type DraggableListSection =
  | {
      type: 'items';
      id: string;
      items: DraggableListItem[];
    }
  | {
      type: 'group';
      id: string;
      title: string;
      items: DraggableListItem[];
    };

export type DndPosition = 'before' | 'after' | 'inside';

export interface DragSource {
  sectionId: string;
  itemId: string;
  path: TreePath;
}

export interface DragTarget {
  sectionId: string;
  itemId: string;
  path: TreePath;
  position: DndPosition;
}

export interface ToggleExpandedEvent {
  sectionId: string;
  itemId: string;
  path: TreePath;
  nextExpanded: boolean;
}

export interface ToggleCheckedEvent {
  sectionId: string;
  itemId: string;
  path: TreePath;
  nextChecked: boolean;
}

export interface ItemClickEvent {
  sectionId: string;
  itemId: string;
  path: TreePath;
  nativeEvent: MouseEvent<HTMLElement>;
}

export type ItemKey = string;
