import {
  CodelistItemBase,
  CodelistData,
  Hierarchy,
  HierarchicalCode,
  TreeNode,
} from '../models/structural-metadata/hierarchy';
import { DataConstraints } from '../models/structural-metadata/constraints';
import { StructuralData } from '../models/structural-metadata/structural-metadata';
import { generateShortUrn, getChildParsedUrn } from './urn';

export function resolveCodelistsFromResponse(
  data?: StructuralData,
): CodelistData[] {
  if (data?.codelists?.length) {
    return data.codelists.map((cl) => ({
      id: cl.id,
      agencyID: cl.agencyID ?? '',
      version: cl.version ?? '',
      name: cl.name,
      codes: cl.codes?.map((code) => ({
        id: code.id,
        name: code.name,
        description: code.description,
      })),
    }));
  }

  // Fallback: SDMX-Plus API returns glossaries with `terms` instead of `codes`
  return (data?.glossaries ?? []).map((gl) => ({
    id: gl.id,
    agencyID: gl.agencyID ?? '',
    version: gl.version ?? '',
    name: gl.name,
    codes: gl.terms?.map((term) => ({
      id: term.id,
      name: term.name,
      description: term.description,
    })),
  }));
}

export function urnMatchesIgnoreVersion(urnA: string, urnB: string): boolean {
  const normalize = (u: string): string => {
    const start = u.indexOf('(');
    if (start === -1) return u;
    const end = u.indexOf(')', start);
    if (end === -1) return u;
    return u.slice(0, start + 1) + '*' + u.slice(end);
  };
  return normalize(urnA) === normalize(urnB);
}

function getCodelistShortUrn(codelist: CodelistData): string {
  return generateShortUrn(codelist.id, codelist.version, codelist.agencyID);
}

function collectCodes(
  result: CodelistItemBase[],
  hierarchicalCodes?: HierarchicalCode[],
  codelists?: CodelistData[],
): void {
  hierarchicalCodes?.forEach((hCode) => {
    const { childId, agency, id, version } = getChildParsedUrn(hCode.code);
    const parentShortUrn = generateShortUrn(id, version, agency);

    const codelist = codelists?.find((c) =>
      urnMatchesIgnoreVersion(parentShortUrn, getCodelistShortUrn(c)),
    );

    const item = codelist?.codes?.find((c) => c.id === childId);

    if (item != null) {
      const normalizedUrn = hCode.code.replace(
        parentShortUrn,
        getCodelistShortUrn(codelist!),
      );
      result.push({ ...item, code: normalizedUrn });
    }

    collectCodes(result, hCode.hierarchicalCodes, codelists);
  });
}

export function getHierarchyCodes(
  hierarchy?: Hierarchy,
  codelists?: CodelistData[],
): CodelistItemBase[] {
  const codes: CodelistItemBase[] = [];
  collectCodes(codes, hierarchy?.hierarchicalCodes, codelists);
  return codes;
}

export function getCodeListsData(
  codelists: CodelistData[],
): Record<string, CodelistItemBase[]> {
  const map: Record<string, CodelistItemBase[]> = {};
  codelists?.forEach((codelist) => {
    map[getCodelistShortUrn(codelist)] = codelist.codes as CodelistItemBase[];
  });
  return map;
}

export function getHierarchyAvailableCodes(
  codes: CodelistItemBase[],
  dimensionId: string,
  contentConstraints?: DataConstraints[],
): CodelistItemBase[] {
  if (!contentConstraints || contentConstraints.length === 0 || !dimensionId) {
    return codes;
  }

  const cubeRegion = contentConstraints[0].cubeRegions?.find(
    (r) => r.isIncluded,
  );
  if (!cubeRegion) return codes;

  const keyValues = cubeRegion.memberSelection?.find(
    (m) => m.componentId === dimensionId,
  );
  if (!keyValues) return [];

  const validIds = new Set(keyValues.selectionValues.map((v) => v.memberValue));
  return codes.filter((c) => validIds.has(c.id));
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

        // Resolve the actual codelist key ignoring version mismatches between
        // the hierarchy reference and the codelist that was returned.
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

        // Whether this node was originally a structural/grouping node
        // (had children in the source data, regardless of pruning).
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

        // Prune structural grouping nodes whose children were all pruned.
        if (isStructuralNode && isLeaf) return null;

        // Prune dimension-codelist leaf nodes that are outside the
        // constraint-available set.
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
          // A non-dimension node is non-selectable only when it has no enabled
          // (dimension) descendants; if it wraps selectable children it acts
          // as a group checkbox and must itself be enabled.
          disabled:
            !isFromDimensionCodelist && children.every((c) => c.disabled),
          parent: parentUrn,
          metadata: { ...code, hierarchicalCodes: undefined },
        } as TreeNode<HierarchicalCode>;
      })
      .filter((node): node is TreeNode<HierarchicalCode> => node !== null) ?? []
  );
}

export function getTreeNodesFromHierarchies(
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
