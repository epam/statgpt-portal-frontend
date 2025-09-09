import {
  Dimension,
  DSDComponentBase,
} from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import {
  Concept,
  ConceptScheme,
} from '@statgpt/sdmx-toolkit/src/models/structural-metadata/concept-scheme';
import { Codelist } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/codelist';
import { getConcept } from '@statgpt/sdmx-toolkit/src/utils/get-concept';
import { getArtifactByUrnWithWildCard } from '@statgpt/sdmx-toolkit/src/utils/wildcards';
import { GridData } from '@statgpt/conversation-view/src/types/data-grid/grid-data';
import { getLocalizedName } from '@statgpt/sdmx-toolkit/src/utils/get-localized-name';

export function getDimRelatedStructures(
  dimension: Dimension,
  conceptSchemes: ConceptScheme[],
  codeLists: Codelist[],
): { concept: Concept | undefined; codeList: Codelist | undefined } {
  const concept = getConcept(dimension.conceptIdentity, conceptSchemes);
  const codeList = getArtifactByUrnWithWildCard(
    concept?.coreRepresentation?.enumeration,
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
