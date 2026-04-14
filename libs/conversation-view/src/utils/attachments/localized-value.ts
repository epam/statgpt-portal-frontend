import {
  Codelist,
  Concept,
  ConceptScheme,
  Dimension,
  DSDComponentBase,
  getArtifactByUrnWithWildCard,
  getConcept,
  getLocalizedName,
} from '@epam/statgpt-sdmx-toolkit';
import { GridData } from '../../types/data-grid/grid-data';

export function getDimRelatedStructures(
  dimension: Dimension,
  conceptSchemes: ConceptScheme[],
  codeLists: Codelist[],
): { concept: Concept | undefined; codeList: Codelist | undefined } {
  const concept = getConcept(dimension.conceptIdentity, conceptSchemes);
  const localEnumeration = dimension?.localRepresentation?.enumeration;
  const coreEnumeration = concept?.coreRepresentation?.enumeration;
  const enumeration = localEnumeration || coreEnumeration;
  const codeList = getArtifactByUrnWithWildCard(
    enumeration,
    codeLists,
  ) as Codelist;
  return {
    concept,
    codeList: codeList || undefined,
  };
}

export function getDimValue(
  dimensions: Dimension[],
  dimensionId: string | undefined,
  data: GridData,
): string | undefined {
  const index = dimensions.findIndex(
    (dim: DSDComponentBase) => dim.id === dimensionId,
  );
  return (data as { originalData: { parsedTimeSeriesValue: string[] } })
    .originalData.parsedTimeSeriesValue[index];
}

export function getDimValueLocalizedName(
  dimensions: Dimension[],
  dimensionId: string | undefined,
  codeList: Codelist | undefined,
  data: GridData,
  locale: string,
): string | undefined {
  const termId = getDimValue(dimensions, dimensionId, data);
  const term = codeList?.codes?.find((term) => term.id === termId);

  return getLocalizedName(term, locale);
}
