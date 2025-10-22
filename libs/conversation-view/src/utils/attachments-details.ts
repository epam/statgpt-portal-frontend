import {
  Codelist,
  ConceptScheme,
  Dimension,
  findCodelistByDimension,
  getConcept,
  getDimensions,
  getLocalizedName,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  getTimePeriod,
  QueryFilter,
  QueryFilterDetails,
  QueryFilterType,
} from '@epam/statgpt-shared-toolkit';
import { isEqual } from 'lodash';
import { AttachmentInfo } from '../models/attachments';
import { getDateString } from './attachments/time-period';

export const getAttachmentInfoList = (
  previousDataQueries: DataQuery[],
  currentDataQueries: DataQuery[],
  datasetStructuresMap: Map<string, StructuralData | undefined>,
  locale: string,
): AttachmentInfo[] => {
  return currentDataQueries?.map((dataQuery) => {
    const previousDataQuery = previousDataQueries?.find(
      (previousDataQuery) => previousDataQuery?.urn === dataQuery?.urn,
    );
    const structures = datasetStructuresMap?.get(dataQuery?.urn);
    const conceptSchemes = structures?.conceptSchemes || [];
    const codelists = structures?.codelists || [];
    const dimensionsList = getDimensions(structures as StructuralData);
    const dimensions = [
      ...(dimensionsList?.dimensions || []),
      ...(dimensionsList?.timeDimensions || []),
    ];

    return {
      datasetName: getLocalizedName(structures?.dataflows?.[0], locale),
      queryFiltersDetails: getUpdatedQueryFiltersDetails(
        getQueryFiltersDetails(
          previousDataQuery?.filters || [],
          dimensions,
          conceptSchemes,
          codelists,
          locale,
        ),
        getQueryFiltersDetails(
          dataQuery?.filters,
          dimensions,
          conceptSchemes,
          codelists,
          locale,
        ),
      ),
    };
  });
};

const getUpdatedQueryFiltersDetails = (
  previousFilters?: QueryFilterDetails[],
  currentFilters?: QueryFilterDetails[],
): QueryFilterDetails[] => {
  const previousFiltersMap = new Map(
    previousFilters?.map((filter) => [filter?.id, filter]),
  );

  return (
    currentFilters?.filter(
      (filterItem) =>
        !isEqual(
          previousFiltersMap?.get(filterItem?.id)?.valuesTitles?.sort(),
          filterItem?.valuesTitles?.sort(),
        ),
    ) || []
  );
};

const getQueryFiltersDetails = (
  filters: QueryFilter[],
  dimensions: Dimension[],
  conceptSchemes: ConceptScheme[],
  codelists: Codelist[],
  locale: string,
): QueryFilterDetails[] => {
  return filters?.map((filter) => {
    const filterDimension = dimensions.find(
      (dimension) => dimension?.id === filter?.componentCode,
    );

    const concept = getConcept(
      filterDimension?.conceptIdentity || '',
      conceptSchemes,
    );
    const codeList = findCodelistByDimension(
      codelists,
      conceptSchemes,
      filterDimension,
    );

    return {
      id: filter?.componentCode,
      title: getLocalizedName(concept, locale),
      valuesTitles:
        filter?.operator === QueryFilterType.BETWEEN
          ? [
              `${getDateString(getTimePeriod(filter?.values?.[0]), locale)} - ${getDateString(getTimePeriod(filter?.values?.[1]), locale)}`,
            ]
          : filter?.values?.map((value) => {
              return (
                getLocalizedName(
                  codeList?.codes?.find((code) => code?.id === value),
                  locale,
                ) || value
              );
            }),
    };
  });
};
