import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { Codelist } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/codelist';
import { getDimensions } from '@statgpt/sdmx-toolkit/src/utils/get-dimensions';
import { DSDComponentConceptBase } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { ElementBase } from '@statgpt/sdmx-toolkit/src/models/structural-metadata-base';
import { getConcept } from '@statgpt/sdmx-toolkit/src/utils/get-concept';
import { getArtifactByUrnWithWildCard } from '@statgpt/sdmx-toolkit/src/utils/wildcards';
import { getConvertedMetaAttributes } from '@statgpt/sdmx-toolkit/src/utils/get-converted-meta-attributes';

export const getStructureComponentsMap = (
  data?: StructuralData,
): Map<string, Codelist | ElementBase> => {
  const structureComponentsMap = new Map<string, Codelist | ElementBase>();
  const dataStructure = data?.dataStructures?.[0];
  const metadataStructure = data?.metadataStructures?.[0];
  const conceptSchemes = data?.conceptSchemes || [];
  const codeLists = data?.codelists || [];

  if (data) {
    const structureComponents = [
      ...(getDimensions(data)?.dimensions || []),
      ...(getDimensions(data)?.timeDimensions || []),
      ...getConvertedMetaAttributes(metadataStructure, dataStructure),
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
