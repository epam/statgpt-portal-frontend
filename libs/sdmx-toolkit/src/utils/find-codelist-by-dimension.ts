import { ConceptScheme } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/concept-scheme';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { getConcept } from '@statgpt/sdmx-toolkit/src/utils/get-concept';
import { getKeyFromUrn } from '@statgpt/sdmx-toolkit/src/utils/urn';
import { getArtifactByUrnWithWildCard } from '@statgpt/sdmx-toolkit/src/utils/wildcards';
import { Codelist } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/codelist';

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
