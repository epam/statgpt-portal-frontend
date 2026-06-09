import {
  DataStructure,
  DSDComponentConceptBase,
  MetadataStructure,
} from '../models/structural-metadata/data-structure';

export const getConvertedMetaAttributes = (
  metadataStructure?: MetadataStructure,
  dataStructure?: DataStructure,
): DSDComponentConceptBase[] => {
  const attributeList = dataStructure?.dataStructureComponents?.attributeList;
  const metadataAttributeList =
    metadataStructure?.metadataStructureComponents?.metadataAttributeList;

  return attributeList?.metadataAttributeUsages?.map((attr) => {
    const metadataAttribute = metadataAttributeList?.metadataAttributes?.find(
      (metadataAttr) => metadataAttr?.id === attr?.metadataAttributeReference,
    );

    return {
      ...metadataAttribute,
      id: metadataAttribute?.id ?? attr.metadataAttributeReference,
      attributeRelationship: attr.attributeRelationship,
      isMandatory: Number(metadataAttribute?.minOccurs) > 0,
    };
  }) as DSDComponentConceptBase[];
};
