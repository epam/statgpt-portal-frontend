import {
  CodelistItemBase,
  CodelistData,
  DataConstraints,
  generateShortUrn,
  getChildParsedUrn,
  getCodeListsData,
  getHierarchyAvailableCodes,
  getHierarchyCodes,
  HierarchicalCode,
  Hierarchy,
  TreeNode,
  urnMatchesIgnoreVersion,
} from '@epam/statgpt-sdmx-toolkit';
import { Filter, FilterTreeNodeProps } from '../models/filters';

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
    const key = `${h.agencyID ?? ''}:${h.id}`;
    const existing = latestMap.get(key);
    if (
      !existing ||
      compareVersions(h.version ?? '', existing.version ?? '') > 0
    ) {
      latestMap.set(key, h);
    }
  }
  return Array.from(latestMap.values());
}

export function buildHierarchyUrn(hierarchy: Hierarchy): string {
  return generateShortUrn(
    hierarchy.id,
    hierarchy.version ?? '',
    hierarchy.agencyID ?? '',
  );
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

function buildNodes(
  codeListMap?: Record<string, CodelistItemBase[]>,
  availableCodes?: string[],
  dimensionCodeListUrn?: string,
  codes?: HierarchicalCode[],
  parentUrn?: string,
): TreeNode<HierarchicalCode>[] {
  return (
    codes
      ?.map((code) => {
        const { childId, agency, id, version } = getChildParsedUrn(code.code);
        const codelistShortUrn = generateShortUrn(id, version, agency);

        const resolvedUrn =
          Object.keys(codeListMap ?? {}).find((key) =>
            urnMatchesIgnoreVersion(key, codelistShortUrn),
          ) ?? codelistShortUrn;
        const items = codeListMap?.[resolvedUrn];
        const item = items?.find((c) => c.id === childId);
        const displayName = item?.name || item?.description || childId;

        const isFromDimensionCodelist = dimensionCodeListUrn
          ? urnMatchesIgnoreVersion(codelistShortUrn, dimensionCodeListUrn)
          : true;

        const isStructuralNode =
          !isFromDimensionCodelist && (code.hierarchicalCodes?.length ?? 0) > 0;

        const children = buildNodes(
          codeListMap,
          availableCodes,
          dimensionCodeListUrn,
          code.hierarchicalCodes,
          code.code,
        );

        const isLeaf = children.length === 0;
        if (isStructuralNode && isLeaf) return null;

        if (
          isFromDimensionCodelist &&
          isLeaf &&
          availableCodes &&
          !availableCodes.includes(childId ?? '')
        )
          return null;

        return {
          id: code.code,
          name: displayName,
          children,
          isExpanded: true,
          disabled:
            !isFromDimensionCodelist && children.every((c) => c.disabled),
          isSelectableValue: isFromDimensionCodelist,
          parent: parentUrn,
          metadata: { ...code, hierarchicalCodes: undefined },
        } as TreeNode<HierarchicalCode>;
      })
      .filter((node): node is TreeNode<HierarchicalCode> => node !== null) ?? []
  );
}

function getTreeNodesFromHierarchies(
  hierarchy?: Hierarchy,
  codeListMap?: Record<string, CodelistItemBase[]>,
  availableCodes?: string[],
  dimensionCodeListUrn?: string,
): TreeNode<HierarchicalCode>[] {
  if (!availableCodes || availableCodes.length === 0) return [];

  return buildNodes(
    codeListMap,
    availableCodes,
    dimensionCodeListUrn,
    hierarchy?.hierarchicalCodes,
    undefined,
  );
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
      isSelectableValue: node.isSelectableValue,
      children: hierarchyNodesToFilterTreeProps(node.children),
    } as FilterTreeNodeProps;
  });
}

function resolveFilterValueId(
  filter: Filter | undefined,
  nodeId: string,
): string | undefined {
  if (filter?.filterType !== 'shared') {
    return nodeId;
  }

  return filter.dimensionValues?.find(
    (value) =>
      value.id === nodeId ||
      value.sourceValues?.some((sourceValue) => sourceValue.id === nodeId),
  )?.id;
}

export function getSelectedHierarchyNodeIds(filter?: Filter): Set<string> {
  if (filter?.filterType !== 'shared') {
    return new Set(
      filter?.dimensionValues
        ?.filter((value) => value.isSelectedValue)
        .map((value) => value.id) ?? [],
    );
  }

  return new Set(
    filter.dimensionValues?.flatMap((value) =>
      value.isSelectedValue
        ? (value.sourceValues?.map((sourceValue) => sourceValue.id) ?? [])
        : [],
    ) ?? [],
  );
}

export function mapHierarchyNodesToFilterValueIds(
  nodes: FilterTreeNodeProps[] | undefined,
  filter?: Filter,
): FilterTreeNodeProps[] {
  if (!nodes?.length || filter?.filterType !== 'shared') {
    return nodes ?? [];
  }

  const mappedNodesById = new Map<string, FilterTreeNodeProps>();

  nodes.forEach((node) => {
    const resolvedId = resolveFilterValueId(filter, node.id);
    if (!resolvedId) {
      return;
    }

    mappedNodesById.set(resolvedId, {
      ...node,
      id: resolvedId,
    });
  });

  return Array.from(mappedNodesById.values());
}

export function mapHierarchyNodeIdToFilterValueId(
  nodeId: string,
  filter?: Filter,
): string | undefined {
  return resolveFilterValueId(filter, nodeId);
}

export function applySelectionToTree(
  nodes: FilterTreeNodeProps[],
  selectedIds: Set<string>,
): FilterTreeNodeProps[] {
  return nodes.map((node) => {
    const updatedChildren = node.children?.length
      ? applySelectionToTree(node.children, selectedIds)
      : node.children;

    let isSelectedValue: boolean;
    if (selectedIds.has(node.id)) {
      // The node's own code is part of the selection.
      isSelectedValue = true;
    } else if (updatedChildren?.length && !node.isSelectableValue) {
      // Structural-only parent (not a real codelist code):
      // derive its checked state from its children.
      const enabledChildren = updatedChildren.filter((c) => !c.disabled);
      isSelectedValue =
        enabledChildren.length > 0 &&
        enabledChildren.every((c) => !!c.isSelectedValue);
    } else {
      // Selectable parent whose own code is not selected, or a leaf. When its
      // children are selected, the indeterminate state is derived at render time.
      isSelectedValue = false;
    }

    return { ...node, isSelectedValue, children: updatedChildren };
  });
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
