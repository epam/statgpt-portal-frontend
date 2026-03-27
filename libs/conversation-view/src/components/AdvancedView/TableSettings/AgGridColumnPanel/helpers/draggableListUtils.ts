import type {
  DraggableListItemNode,
  DraggableListNode,
} from '@epam/statgpt-ui-components';

export function getItemNodeByPath(
  nodes: DraggableListNode[],
  path: readonly string[],
): DraggableListItemNode | undefined {
  let currentNodes = nodes;
  let current: DraggableListNode | undefined;

  for (const id of path) {
    current = currentNodes.find((node) => node.id === id);

    if (!current) {
      return undefined;
    }

    currentNodes =
      current.type === 'group' ? current.items : (current.items ?? []);
  }

  return current?.type === 'item' ? current : undefined;
}

export function flattenIncludedLeafIds(
  nodes: DraggableListNode[],
  isLeaf?: (node: DraggableListItemNode) => boolean,
): string[] {
  const result: string[] = [];

  for (const node of nodes) {
    if (node.type === 'group') {
      result.push(...flattenIncludedLeafIds(node.items, isLeaf));
      continue;
    }

    if (isLeaf?.(node)) {
      result.push(node.id);
      continue;
    }

    if (node.items?.length) {
      result.push(...flattenIncludedLeafIds(node.items, isLeaf));
      continue;
    }

    result.push(node.id);
  }

  return result;
}
