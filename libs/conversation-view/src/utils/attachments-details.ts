import {
  Codelist,
  ConceptScheme,
  Dimension,
  findCodelistByDimension,
  getConcept,
  getDimensions,
  getLocalizedName,
  StructuralData,
  DatasetQueryFilters,
  TIME_PERIOD,
  getTimeSeriesFilterKey,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  getTimePeriod,
  QueryFilter,
  QueryFilterDetails,
  QueryFilterType,
} from '@epam/statgpt-shared-toolkit';
import { isEqual } from 'lodash';
import { getDateString } from './attachments/time-period';
import { AttachmentInfo } from '../models/attachments';

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

export const getExternalUrlQueryParam = (
  filters?: DatasetQueryFilters,
  dataQuery?: DataQuery,
  dimensions?: Dimension[],
): string => {
  let startPeriod = '';
  let endPeriod = '';

  if (filters?.timeFilter) {
    const timeFilterValue = decodeURIComponent(filters.timeFilter || '')?.split(
      ':',
    );
    startPeriod = timeFilterValue[1] || '';
    endPeriod = timeFilterValue[3] || '';
  } else if (dataQuery) {
    const periodFilter = dataQuery?.filters.find(
      (filter) => filter.componentCode === TIME_PERIOD,
    );
    startPeriod = periodFilter?.values?.[0] || '';
    endPeriod = periodFilter?.values?.[1] || '';
  }

  const explorerQueryFilters =
    filters?.filterKey ||
    getTimeSeriesFilterKey(dimensions || [], dataQuery?.filters || []);

  return `&filter=${explorerQueryFilters}&startPeriod=${startPeriod}&endPeriod=${endPeriod}`;
};

export const getExternalLink = (
  isExternaLinkIncludeFilters?: boolean,
  filters?: DatasetQueryFilters,
  dataQuery?: DataQuery,
  dimensions?: Dimension[],
): string => {
  const datasetUrl = dataQuery?.metadata?.datasetUrl;
  if (!datasetUrl) {
    return '';
  }

  const queryParams = isExternaLinkIncludeFilters
    ? getExternalUrlQueryParam(filters, dataQuery, dimensions)
    : '';
  return datasetUrl + queryParams;
};
