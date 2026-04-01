import {
  GlossaryElementBase,
  Glossary,
  Hierarchy,
  HierarchicalCode,
  TreeNode,
} from '../models/structural-metadata/hierarchy';
import { DataConstraints } from '../models/structural-metadata/constraints';
import { generateShortUrn, getChildParsedUrn } from './urn';

export function urnMatchesIgnoreVersion(urnA: string, urnB: string): boolean {
  const normalize = (u: string) => u.replace(/\([^)]+\)/, '(*)');
  return normalize(urnA) === normalize(urnB);
}

export function getGlossaryShortUrn(glossary: Glossary): string {
  return generateShortUrn(glossary.id, glossary.version, glossary.agencyID);
}

function collectCodes(
  result: GlossaryElementBase[],
  hierarchicalCodes?: HierarchicalCode[],
  glossaries?: Glossary[],
): void {
  hierarchicalCodes?.forEach((hCode) => {
    const { childId, agency, id, version } = getChildParsedUrn(hCode.code);
    const parentShortUrn = generateShortUrn(id, version, agency);

    const glossary = glossaries?.find((g) =>
      urnMatchesIgnoreVersion(parentShortUrn, getGlossaryShortUrn(g)),
    );

    const term = glossary?.terms?.find((t) => t.id === childId);

    if (term != null) {
      const normalizedUrn = hCode.code.replace(
        parentShortUrn,
        getGlossaryShortUrn(glossary!),
      );
      result.push({ ...term, code: normalizedUrn });
    }

    collectCodes(result, hCode.hierarchicalCodes, glossaries);
  });
}

export function getHierarchyCodes(
  hierarchy?: Hierarchy,
  glossaries?: Glossary[],
): GlossaryElementBase[] {
  const codes: GlossaryElementBase[] = [];
  collectCodes(codes, hierarchy?.hierarchicalCodes, glossaries);
  return codes;
}

export function getCodeListsData(
  glossaries: Glossary[],
): Record<string, GlossaryElementBase[]> {
  const map: Record<string, GlossaryElementBase[]> = {};
  glossaries?.forEach((glossary) => {
    map[getGlossaryShortUrn(glossary)] =
      glossary.terms as GlossaryElementBase[];
  });
  return map;
}

export function getHierarchyAvailableCodes(
  codes: GlossaryElementBase[],
  dimensionId: string,
  contentConstraints?: DataConstraints[],
): GlossaryElementBase[] {
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
  codeListMap?: Record<string, GlossaryElementBase[]>,
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
        // the hierarchy reference and the glossary that was returned.
        const resolvedUrn =
          Object.keys(codeListMap ?? {}).find((key) =>
            urnMatchesIgnoreVersion(key, codelistShortUrn),
          ) ?? codelistShortUrn;
        const terms = codeListMap?.[resolvedUrn];
        const term = terms?.find((t) => t.id === childId);
        const displayName = term?.name || term?.description || childId;

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
          // Structural grouping nodes are non-selectable labels; leaf nodes
          // (including cross-codelist ones) are selectable checkboxes.
          disabled: isStructuralNode,
          parent: parentUrn,
          metadata: { ...code, hierarchicalCodes: undefined },
        } as TreeNode<HierarchicalCode>;
      })
      .filter((node): node is TreeNode<HierarchicalCode> => node !== null) ?? []
  );
}

export function getTreeNodesFromHierarchies(
  hierarchy?: Hierarchy,
  codeListMap?: Record<string, GlossaryElementBase[]>,
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
