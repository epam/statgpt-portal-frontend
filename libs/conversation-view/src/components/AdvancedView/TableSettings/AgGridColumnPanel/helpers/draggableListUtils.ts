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
 * Ensures the last visible leaf item inside every named group of an enriched
 * draggable list item cannot be unchecked, preventing a column group from
 * becoming completely empty.
 *
 * A leaf is considered visible when `isChecked` is not explicitly `false`.
 * When exactly one visible leaf remains in a group, the visible leaf is
 * returned with `checkable: false`, and all item leaves in that group are
 * returned with `draggable: false`. Groups with zero or two or more visible
 * leaves are left unchanged.
 *
 * @param item - A top-level draggable list item node, potentially containing
 *   named group sub-nodes with leaf items.
 * @returns A new item node with the last-visible-leaf protection applied, or
 *   the original node if no protection is needed.
 */
export function protectLastVisibleLeafInGroups(
  item: DraggableListItemNode,
): DraggableListItemNode {
  if (!item.items?.length) return item;

  // Single-dataset flat layout: leaves are direct children with no group wrapper.
  // Apply protection across the entire flat list.
  if (item.items.every((n) => n.type === 'item')) {
    const leafItems = item.items as DraggableListItemNode[];
    const visibleLeaves = leafItems.filter((i) => i.isChecked !== false);
    if (visibleLeaves.length !== 1) return item;
    const [soleVisibleLeaf] = visibleLeaves;
    return {
      ...item,
      items: leafItems.map((leaf) =>
        leaf === soleVisibleLeaf
          ? { ...leaf, checkable: false, draggable: false }
          : { ...leaf, draggable: false },
      ),
    };
  }

  // Multi-dataset layout: protect the last visible leaf within each group.
  const newGroupItems = item.items.map((node) => {
    if (node.type !== 'group') return node;

    const leafItems = node.items.filter(
      (i): i is DraggableListItemNode => i.type === 'item',
    );
    const visibleLeaves = leafItems.filter((i) => i.isChecked !== false);

    if (visibleLeaves.length !== 1) return node;

    const [soleVisibleLeaf] = visibleLeaves;
    return {
      ...node,
      items: node.items.map((leaf) =>
        leaf.type !== 'item'
          ? leaf
          : leaf === soleVisibleLeaf
            ? { ...leaf, checkable: false, draggable: false }
            : { ...leaf, draggable: false },
      ),
    };
  });

  if (newGroupItems.every((newNode, i) => newNode === item.items![i])) {
    return item;
  }

  return { ...item, items: newGroupItems };
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
