import { MouseEvent } from 'react';

export type TreePath = readonly string[];

export type ItemKey = string;

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

interface DraggableListBaseEvent {
  itemId: ItemKey;
  path: TreePath;
}

export interface ItemClickEvent extends DraggableListBaseEvent {
  nativeEvent: MouseEvent<HTMLElement>;
}

export interface ToggleExpandedEvent extends DraggableListBaseEvent {
  nextExpanded: boolean;
}

export interface ToggleCheckedEvent extends DraggableListBaseEvent {
  nextChecked: boolean;
}
