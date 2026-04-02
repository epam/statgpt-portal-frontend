import {
  DataConstraints,
  generateShortUrn,
  getChildParsedUrn,
  getCodeListsData,
  getHierarchyAvailableCodes,
  getHierarchyCodes,
  getTreeNodesFromHierarchies,
  Glossary,
  HierarchicalCode,
  Hierarchy,
  TreeNode,
} from '@epam/statgpt-sdmx-toolkit';
import { FilterTreeNodeProps } from '../models/filters';

export function buildHierarchyUrn(hierarchy: Hierarchy): string {
  return generateShortUrn(hierarchy.id, hierarchy.version, hierarchy.agencyID);
}

export function buildHierarchyFilterTreeProps(
  mainHierarchy: Hierarchy,
  glossaries: Glossary[],
  filterId: string,
  constraints: DataConstraints[] | undefined,
  codelistUrn: string | undefined,
): FilterTreeNodeProps[] {
  const flatCodes = getHierarchyCodes(mainHierarchy, glossaries);
  const availableCodes = getHierarchyAvailableCodes(
    flatCodes,
    filterId,
    constraints,
  );
  const codeListMap = getCodeListsData(glossaries);
  const treeNodes = getTreeNodesFromHierarchies(
    mainHierarchy,
    codeListMap,
    availableCodes.map((c) => c.id),
    codelistUrn,
  );
  return hierarchyNodesToFilterTreeProps(treeNodes);
}

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
