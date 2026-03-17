import type {
  DraggableListItemNode,
  DraggableListNode,
  TreePath,
} from '../types';

export function itemKey(parentPath: readonly string[], itemId: string): string {
  return `i:${[...parentPath, itemId].join('/')}`;
}

export function parseItemKey(
  key: string,
): { parentPath: string[]; itemId: string } | null {
  if (!key.startsWith('i:')) return null;

  const rest = key.slice(2);
  const parts = rest.split('/').filter(Boolean);
  if (!parts.length) return null;

  return {
    parentPath: parts.slice(0, -1),
    itemId: parts[parts.length - 1],
  };
}

export function findItemNode(
  nodes: DraggableListNode[],
  parentPath: readonly string[],
  itemId: string,
): DraggableListItemNode | null {
  const siblings = getSortableItemSiblings(nodes, parentPath);
  if (!siblings) return null;
  return siblings.find((node) => node.id === itemId) ?? null;
}

export function getNodesAtPath(
  nodes: DraggableListNode[],
  path: readonly string[],
): DraggableListNode[] | null {
  if (path.length === 0) return nodes;

  const [head, ...tail] = path;
  const parent = nodes.find((node) => node.id === head);

  if (!parent?.items) return null;

  return getNodesAtPath(parent.items, tail);
}

export function getSortableItemSiblings(
  nodes: DraggableListNode[],
  parentPath: readonly string[],
): DraggableListItemNode[] | null {
  const levelNodes = getNodesAtPath(nodes, parentPath);
  if (!levelNodes) return null;

  return levelNodes.filter(
    (node): node is DraggableListItemNode => node.type === 'item',
  );
}

export function updateItemsAtParent(
  nodes: DraggableListNode[],
  parentPath: TreePath,
  updater: (nodes: DraggableListNode[]) => DraggableListNode[],
): DraggableListNode[] {
  if (parentPath.length === 0) {
    return updater(nodes);
  }

  const [head, ...tail] = parentPath;

  return nodes.map((node) => {
    if (node.id !== head) return node;
    if (!node.items) return node;

    return {
      ...node,
      items: updateItemsAtParent(node.items, tail, updater),
    };
  });
}
