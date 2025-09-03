import {
  Concept,
  ConceptScheme,
} from '@statgpt/sdmx-toolkit/src/models/structural-metadata/concept-scheme';
import {
  getArtifactByUrnWithWildCard,
  SINGLE_WILDCARD_SYMBOL,
} from '@statgpt/sdmx-toolkit/src/utils/wildcards';
import { getChildParsedUrn } from '@statgpt/sdmx-toolkit/src/utils/urn';

export const getConcept = (
  conceptIdentity: string,
  conceptSchemes: ConceptScheme[],
): Concept | undefined => {
  const { concept } = getConceptWithScheme(conceptIdentity, conceptSchemes);

  return concept;
};

export const getConceptWithScheme = (
  conceptIdentity: string,
  conceptSchemes: ConceptScheme[],
): { scheme: ConceptScheme | undefined; concept: Concept | undefined } => {
  if (conceptIdentity == null) {
    return {
      concept: undefined,
      scheme: undefined,
    };
  }

  const { childId, agency, id, version } = getChildParsedUrn(conceptIdentity);

  if (version?.includes(SINGLE_WILDCARD_SYMBOL)) {
    const scheme: ConceptScheme | undefined = getArtifactByUrnWithWildCard(
      conceptIdentity,
      conceptSchemes,
    );

    return {
      concept: getConceptByUrn(scheme?.concepts || [], childId),
      scheme,
    };
  }

  for (const scheme of conceptSchemes) {
    if (isEqualSchemes(scheme, id, agency, version)) {
      const concept = getConceptByUrn(scheme?.concepts || [], childId);

      return {
        concept,
        scheme,
      };
    }
  }

  return {
    concept: undefined,
    scheme: undefined,
  };
};

export const getConceptByUrn = (
  concepts: Concept[],
  childId: string | undefined,
): Concept | undefined =>
  concepts?.find((concept: Concept) => concept.id === childId);

const isEqualSchemes = (
  scheme: ConceptScheme,
  id: string | undefined,
  agency: string | undefined,
  version: string | undefined,
): boolean => {
  return (
    scheme.id === id && scheme.agencyID === agency && scheme.version === version
  );
};
