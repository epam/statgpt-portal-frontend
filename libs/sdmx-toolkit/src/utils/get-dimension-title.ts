import { ConceptScheme } from '../models/structural-metadata/concept-scheme';
import { Dimension } from '../models/structural-metadata/data-structure';
import { getConcept } from './get-concept';
import { getKeyFromUrn } from './urn';
import { getLocalizedName } from './get-localized-name';

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
