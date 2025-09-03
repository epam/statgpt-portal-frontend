import { ConceptScheme } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/concept-scheme';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { getConcept } from '@statgpt/sdmx-toolkit/src/utils/get-concept';
import { getKeyFromUrn } from '@statgpt/sdmx-toolkit/src/utils/urn';
import { getLocalizedName } from '@statgpt/sdmx-toolkit/src/utils/get-localized-name';

export const getDimensionTitle = (
  conceptSchemes: ConceptScheme[] = [],
  dimension?: Dimension,
  locale?: string,
): string | undefined => {
  const conceptIdentity = getKeyFromUrn(dimension?.conceptIdentity) || '';
  const concept = getConcept(conceptIdentity, conceptSchemes);

  return locale
    ? getLocalizedName(concept, locale)
    : (concept?.name ?? concept?.id ?? dimension?.id);
};
