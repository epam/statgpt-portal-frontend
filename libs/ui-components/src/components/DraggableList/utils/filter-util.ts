import { DraggableListItemNode, DraggableListNode } from '../types';

export interface FilterDraggableListNodesOptions {
  expandMatchedBranches?: boolean;
  includeGroupDescendantsOnMatch?: boolean;
  includeItemDescendantsOnMatch?: boolean;
  match?: (node: DraggableListNode, normalizedQuery: string) => boolean;
}

const defaultMatch = (
  node: DraggableListNode,
  normalizedQuery: string,
): boolean => {
  return node.label.toLowerCase().includes(normalizedQuery);
};

/**
 * Filters a hierarchical `DraggableListNode` tree using a search query.
 *
 * Matching nodes are included in the result along with all required ancestors
 * so the structure remains valid for rendering in `DraggableList`.
 * Non-matching branches are removed.
 *
 * Groups and items behave slightly differently:
 * - Matching **groups** keep their full subtree by default.
 * - Matching **items** keep only themselves unless
 *   `includeItemDescendantsOnMatch` is enabled.
 *
 * Parent items containing matched descendants can be automatically expanded.
 *
 * @example
 * ```ts
 * const filtered = filterDraggableListNodes(nodes, 'indicator');
 * ```
 *
 * @param nodes - Root nodes of the draggable list tree.
 * @param query - Search query (trimmed and matched case-insensitively).
 *                If empty, the original nodes are returned.
 * @param options - Optional filtering behavior.
 * @param options.expandMatchedBranches - Expands parent items containing matches.
 * @param options.includeGroupDescendantsOnMatch - Keeps full subtree when a group matches.
 * @param options.includeItemDescendantsOnMatch - Keeps full subtree when an item matches.
 * @param options.match - Custom node matching function.
 *
 * @returns A filtered tree containing only matching nodes and their ancestors.
 */
export function filterDraggableListNodes(
  nodes: DraggableListNode[],
  query: string,
  options: FilterDraggableListNodesOptions = {},
): DraggableListNode[] {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return nodes;
  }

  const {
    expandMatchedBranches = true,
    includeGroupDescendantsOnMatch = true,
    includeItemDescendantsOnMatch = false,
    match = defaultMatch,
  } = options;

  const filtered = filterNodesRecursive(nodes, normalizedQuery, {
    expandMatchedBranches,
    includeGroupDescendantsOnMatch,
    includeItemDescendantsOnMatch,
    match,
  });

  return filtered ?? [];
}

function filterNodesRecursive(
  nodes: DraggableListNode[],
  normalizedQuery: string,
  options: Required<FilterDraggableListNodesOptions>,
): DraggableListNode[] | null {
  const result: DraggableListNode[] = [];

  for (const node of nodes) {
    const filteredNode = filterSingleNode(node, normalizedQuery, options);
    if (filteredNode) {
      result.push(filteredNode);
    }
  }

  return result.length ? result : null;
}

function filterSingleNode(
  node: DraggableListNode,
  normalizedQuery: string,
  options: Required<FilterDraggableListNodesOptions>,
): DraggableListNode | null {
  const selfMatches = options.match(node, normalizedQuery);

  if (node.type === 'group') {
    if (selfMatches && options.includeGroupDescendantsOnMatch) {
      return expandTree(node, options.expandMatchedBranches);
    }

    const filteredChildren = node.items?.length
      ? filterNodesRecursive(node.items, normalizedQuery, options)
      : null;

    if (!selfMatches && !filteredChildren) {
      return null;
    }

    return {
      ...node,
      items: filteredChildren ?? [],
    };
  }

  const filteredChildren = node.items?.length
    ? filterNodesRecursive(node.items, normalizedQuery, options)
    : null;

  if (selfMatches && options.includeItemDescendantsOnMatch) {
    return expandTree(node, options.expandMatchedBranches);
  }

  if (!selfMatches && !filteredChildren) {
    return null;
  }

  const nextNode: DraggableListItemNode = {
    ...node,
  };

  if (filteredChildren) {
    nextNode.items = filteredChildren;

    if (options.expandMatchedBranches) {
      nextNode.isExpanded = true;
    }
  } else {
    delete nextNode.items;
  }

  return nextNode;
}

function expandTree<T extends DraggableListNode>(
  node: T,
  expandMatchedBranches: boolean,
): T {
  if (node.type === 'group') {
    return {
      ...node,
      items: node.items.map((child) =>
        expandTree(child, expandMatchedBranches),
      ),
    };
  }

  return {
    ...node,
    isExpanded:
      expandMatchedBranches && node.items?.length ? true : node.isExpanded,
    items: node.items?.map((child) => expandTree(child, expandMatchedBranches)),
  };
}

function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}
