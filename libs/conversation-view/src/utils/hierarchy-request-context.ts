import {
  DataStructure,
  Dimension,
  findCodelistByDimension,
  generateShortUrn,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { Filter } from '../models/filters';

const getFilterDatasetUrns = (filter: Filter): string[] => {
  const datasetUrns =
    filter.filterType === 'dataset'
      ? [filter.datasetUrn]
      : filter.sourceDatasetUrns;

  return Array.from(
    new Set(
      (datasetUrns || []).filter(
        (datasetUrn): datasetUrn is string => !!datasetUrn,
      ),
    ),
  );
};

const hasMatchingDimension = (
  dataStructure: DataStructure,
  filterId?: string,
): boolean => {
  if (!filterId) {
    return false;
  }

  const dimensionList = dataStructure.dataStructureComponents?.dimensionList;
  const dimensions = [
    ...(dimensionList?.dimensions || []),
    ...(dimensionList?.timeDimensions || []),
  ];

  return dimensions.some((dimension) => dimension.id === filterId);
};

const getUniformValue = (
  values: Array<string | undefined>,
): string | undefined => {
  if (!values.length || values.some((value) => !value)) {
    return undefined;
  }

  const uniqueValues = Array.from(new Set(values));
  return uniqueValues.length === 1 ? uniqueValues[0] : undefined;
};

const getRelevantDataStructures = (
  filterId: string | undefined,
  structures?: StructuralData,
): DataStructure[] => {
  const dataStructures = structures?.dataStructures || [];
  if (!dataStructures.length) {
    return [];
  }

  const matchingDataStructures = dataStructures.filter((dataStructure) =>
    hasMatchingDimension(dataStructure, filterId),
  );

  if (matchingDataStructures.length) {
    return matchingDataStructures;
  }

  return dataStructures.length === 1 ? dataStructures : [];
};

const getDataStructureUrn = (
  dataStructure: DataStructure,
): string | undefined =>
  dataStructure.urn ??
  generateShortUrn(
    dataStructure.id,
    dataStructure.version,
    dataStructure.agencyID,
  );

export const getSourceArtefactUrnForDatasetFilter = (
  filterId: string | undefined,
  structures?: StructuralData,
): string | undefined =>
  getUniformValue(
    getRelevantDataStructures(filterId, structures).map(getDataStructureUrn),
  );

export const getCodelistUrnForDatasetFilter = (
  filterId: string | undefined,
  datasetUrn: string | undefined,
  dimensionsMap?: Map<string, Dimension[]>,
  structuresMap?: Map<string, StructuralData | undefined>,
): string | undefined => {
  if (!filterId || !datasetUrn) {
    return undefined;
  }

  const dimension = dimensionsMap
    ?.get(datasetUrn)
    ?.find((item) => item.id === filterId);
  if (!dimension) {
    return undefined;
  }

  if (dimension.localRepresentation?.enumeration) {
    return dimension.localRepresentation.enumeration;
  }

  const structuralData = structuresMap?.get(datasetUrn);
  const codelist = findCodelistByDimension(
    structuralData?.codelists,
    structuralData?.conceptSchemes,
    dimension,
  );

  return codelist
    ? (codelist.urn ??
        generateShortUrn(codelist.id, codelist.version, codelist.agencyID))
    : undefined;
};

export const getHierarchyRequestContextForFilter = (
  filter: Filter,
  dimensionsMap?: Map<string, Dimension[]>,
  structuresMap?: Map<string, StructuralData | undefined>,
): {
  codelistUrn?: string;
  sourceArtefactUrn?: string;
} => {
  const datasetUrns = getFilterDatasetUrns(filter);

  return {
    codelistUrn: getUniformValue(
      datasetUrns.map((datasetUrn) =>
        getCodelistUrnForDatasetFilter(
          filter.id,
          datasetUrn,
          dimensionsMap,
          structuresMap,
        ),
      ),
    ),
    sourceArtefactUrn: getUniformValue(
      datasetUrns.map((datasetUrn) =>
        getSourceArtefactUrnForDatasetFilter(
          filter.id,
          structuresMap?.get(datasetUrn),
        ),
      ),
    ),
  };
};
