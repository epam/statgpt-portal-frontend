import {
  CodelistData,
  DataConstraints,
  generateShortUrn,
  getChildParsedUrn,
  getCodeListsData,
  getHierarchyAvailableCodes,
  getHierarchyCodes,
  getTreeNodesFromHierarchies,
  HierarchicalCode,
  Hierarchy,
  TreeNode,
} from '@epam/statgpt-sdmx-toolkit';
import { FilterTreeNodeProps } from '../models/filters';

function compareVersions(a: string, b: string): number {
  const aParts = (a ?? '').split('.').map(Number);
  const bParts = (b ?? '').split('.').map(Number);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function getLatestHierarchies(hierarchies: Hierarchy[]): Hierarchy[] {
  const latestMap = new Map<string, Hierarchy>();
  for (const h of hierarchies) {
    const key = `${h.agencyID}:${h.id}`;
    const existing = latestMap.get(key);
    if (!existing || compareVersions(h.version, existing.version) > 0) {
      latestMap.set(key, h);
    }
  }
  return Array.from(latestMap.values());
}

export function buildHierarchyUrn(hierarchy: Hierarchy): string {
  return generateShortUrn(hierarchy.id, hierarchy.version, hierarchy.agencyID);
}

export function buildHierarchyFilterTreeProps(
  mainHierarchy: Hierarchy,
  codelists: CodelistData[],
  filterId: string,
  constraints: DataConstraints[] | undefined,
  codelistUrn: string | undefined,
): FilterTreeNodeProps[] {
  const flatCodes = getHierarchyCodes(mainHierarchy, codelists);
  const availableCodes = getHierarchyAvailableCodes(
    flatCodes,
    filterId,
    constraints,
  );
  const codeListMap = getCodeListsData(codelists);
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

export function toggleTreeNodeExpansion(
  nodes: FilterTreeNodeProps[],
  nodeId: string,
): FilterTreeNodeProps[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, isExpanded: !node.isExpanded };
    }
    if (node.children?.length) {
      return {
        ...node,
        children: toggleTreeNodeExpansion(node.children, nodeId),
      };
    }
    return node;
  });
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
