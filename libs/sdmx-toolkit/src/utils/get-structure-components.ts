import { StructuralData } from '../models/structural-metadata/structural-metadata';
import { Codelist } from '../models/structural-metadata/codelist';
import { getDimensions } from './get-dimensions';
import { DSDComponentConceptBase } from '../models/structural-metadata/data-structure';
import { ElementBase } from '../models/structural-metadata/structural-metadata-base';
import { getConcept } from './get-concept';
import { getArtifactByUrnWithWildCard } from './wildcards';
import { getConvertedMetaAttributes } from './get-converted-meta-attributes';

export const getStructureComponentsMap = (
  data?: StructuralData,
): Map<string, Codelist | ElementBase> => {
  const structureComponentsMap = new Map<string, Codelist | ElementBase>();
  const dataStructure = data?.dataStructures?.[0];
  const metadataStructure = data?.metadataStructures?.[0];
  const conceptSchemes = data?.conceptSchemes || [];
  const codeLists = data?.codelists || [];

  if (data) {
    const convertedMeta = getConvertedMetaAttributes(metadataStructure, dataStructure);

    const structureComponents = [
      ...(getDimensions(data)?.dimensions || []),
      ...(getDimensions(data)?.timeDimensions || []),
      ...convertedMeta,
      ...(dataStructure?.dataStructureComponents?.attributeList?.attributes ||
        []),
    ];

    structureComponents.forEach(
      (structureComponent: DSDComponentConceptBase) => {
        const concept = getConcept(
          structureComponent?.conceptIdentity,
          conceptSchemes,
        );
        const codeListUrn =
          structureComponent?.localRepresentation?.enumeration ||
          concept?.coreRepresentation?.enumeration;
        const codeList = getArtifactByUrnWithWildCard(
          codeListUrn,
          codeLists,
        ) as Codelist;

        if (structureComponent?.id) {
          if (!codeListUrn) {
            structureComponentsMap.set(structureComponent?.id, {
              id: structureComponent?.id,
              name: concept?.name,
              names: concept?.names,
            });
          } else {
            structureComponentsMap.set(structureComponent?.id, {
              ...codeList,
              name: concept?.name,
              names: concept?.names,
            });
          }
        }
      },
    );
  }

  return structureComponentsMap;
};
