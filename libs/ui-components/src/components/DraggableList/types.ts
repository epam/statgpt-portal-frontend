import { MouseEvent } from 'react';

export type TreePath = readonly string[];

interface DraggableListBaseNode {
  id: string;
  label: string;
  isDisabled?: boolean;
}

export interface DraggableListItemNode extends DraggableListBaseNode {
  type: 'item';
  items?: DraggableListNode[];
  isExpanded?: boolean;
  isChecked?: boolean;
  draggable?: boolean;
  checkable?: boolean;
}

export interface DraggableListGroupNode extends DraggableListBaseNode {
  type: 'group';
  items: DraggableListNode[];
}

export type DraggableListNode = DraggableListItemNode | DraggableListGroupNode;

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

export interface ItemClickEvent {
  itemId: string;
  path: TreePath;
  nativeEvent: MouseEvent<HTMLElement>;
}

export interface ToggleExpandedEvent {
  itemId: string;
  path: TreePath;
  nextExpanded: boolean;
}

export interface ToggleCheckedEvent {
  itemId: string;
  path: TreePath;
  nextChecked: boolean;
}

export type ItemKey = string;
