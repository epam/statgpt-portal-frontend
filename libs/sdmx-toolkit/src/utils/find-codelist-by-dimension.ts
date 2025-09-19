import { ConceptScheme } from '../models/structural-metadata/concept-scheme';
import { Dimension } from '../models/structural-metadata/data-structure';
import { getConcept } from './get-concept';
import { getKeyFromUrn } from './urn';
import { getArtifactByUrnWithWildCard } from './wildcards';
import { Codelist } from '../models/structural-metadata/codelist';

export const findCodelistByDimension = (
  codeLists: Codelist[] = [],
  conceptSchemes: ConceptScheme[] = [],
  dimension?: Dimension,
): Codelist | undefined => {
  const conceptIdentity = dimension?.conceptIdentity || '';
  const concept = getConcept(conceptIdentity, conceptSchemes);
  const localEnumeration = getKeyFromUrn(
    dimension?.localRepresentation?.enumeration,
  );
  const coreEnumeration = getKeyFromUrn(
    concept?.coreRepresentation?.enumeration,
  );
  const enumeration = localEnumeration || coreEnumeration;
  if (enumeration == null) {
    return void 0;
  }
  return getArtifactByUrnWithWildCard(enumeration, codeLists);
};
