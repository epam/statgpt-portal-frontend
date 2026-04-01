import {
  getChildParsedUrn,
  HierarchicalCode,
  TreeNode,
} from '@epam/statgpt-sdmx-toolkit';
import { FilterTreeNodeProps } from '../models/filters';

export function hierarchyNodesToFilterTreeProps(
  nodes: TreeNode<HierarchicalCode>[],
): FilterTreeNodeProps[] {
  return nodes.map((node) => {
    const { childId } = getChildParsedUrn(node.id ?? '');
    return {
      id: childId ?? node.id ?? '',
      name: node.name,
      isExpanded: node.isExpanded,
      isSelectedValue: false,
      disabled: node.disabled,
      children: hierarchyNodesToFilterTreeProps(node.children),
    } as FilterTreeNodeProps;
  });
}

export function applySelectionToTree(
  nodes: FilterTreeNodeProps[],
  selectedIds: Set<string>,
): FilterTreeNodeProps[] {
  return nodes.map((node) => ({
    ...node,
    isSelectedValue: selectedIds.has(node.id),
    children: node.children
      ? applySelectionToTree(node.children, selectedIds)
      : undefined,
  }));
}

export function filterHierarchyNodes(
  nodes: FilterTreeNodeProps[],
  searchText: string,
): FilterTreeNodeProps[] {
  const lower = searchText.toLowerCase();
  return nodes.reduce<FilterTreeNodeProps[]>((acc, node) => {
    const matchesSelf = node.name?.toLowerCase().includes(lower);
    const filteredChildren = filterHierarchyNodes(
      node.children ?? [],
      searchText,
    );

    if (matchesSelf || filteredChildren.length > 0) {
      acc.push({
        ...node,
        isExpanded: true,
        children: matchesSelf ? node.children : filteredChildren,
      });
    }
    return acc;
  }, []);
}
