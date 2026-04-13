import {
  CodelistItemBase,
  CodelistData,
  Hierarchy,
  HierarchicalCode,
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
  return generateShortUrn(
    codelist.id,
    codelist.version ?? '',
    codelist.agencyID ?? '',
  );
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
