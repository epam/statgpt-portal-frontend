import type {
  DraggableListItemNode,
  DraggableListNode,
} from '@epam/statgpt-ui-components';

/**
 * Traverses a tree of draggable list nodes along a path of IDs and returns the item node at the end.
 *
 * @param nodes - The top-level array of nodes to start traversal from.
 * @param path - Ordered sequence of node IDs representing the path to the target item.
 * @returns The item node found at the given path, or `undefined` if any segment is missing or the final node is not an item.
 */
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

/**
 * Recursively collects IDs of all leaf item nodes from a draggable list tree.
 *
 * @param nodes - The array of nodes to flatten.
 * @param isLeaf - Optional predicate that marks a node as a leaf, stopping further descent into its children.
 * @returns A flat array of IDs for all resolved leaf item nodes in depth-first order.
 */
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
