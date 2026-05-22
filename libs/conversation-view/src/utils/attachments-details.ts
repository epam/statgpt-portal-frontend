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
  DatasetDimensionsMetadataMap,
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
import { getSharedFilterIdForDatasetDimension } from './multiple-filters';

const getStructurePartsForDataQuery = (
  dataQuery: DataQuery,
  datasetStructuresMap: Map<string, StructuralData | undefined>,
) => {
  const structures = datasetStructuresMap?.get(dataQuery?.urn);
  const conceptSchemes = structures?.conceptSchemes || [];
  const codelists = structures?.codelists || [];
  const dimensionsList = getDimensions(structures as StructuralData);
  const dimensions = [
    ...(dimensionsList?.dimensions || []),
    ...(dimensionsList?.timeDimensions || []),
  ];
  return { structures, conceptSchemes, codelists, dimensions };
};

export const getAttachmentInfoList = (
  previousDataQueries: DataQuery[],
  currentDataQueries: DataQuery[],
  datasetStructuresMap: Map<string, StructuralData | undefined>,
  locale: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): AttachmentInfo[] => {
  const enabledDataQueries =
    currentDataQueries?.filter((q) => !q.disabled) ?? [];
  const currentValuesByFilterId = new Map<string, string[]>();
  enabledDataQueries?.forEach((dataQuery) => {
    const { conceptSchemes, codelists, dimensions } =
      getStructurePartsForDataQuery(dataQuery, datasetStructuresMap);
    getQueryFiltersDetails(
      (dataQuery?.filters ?? []).filter(
        (f) => f.operator !== QueryFilterType.EXCLUDED,
      ),
      dataQuery?.urn,
      dimensions,
      conceptSchemes,
      codelists,
      locale,
      datasetDimensionsMetadataMap,
    ).forEach((detail) => {
      if (detail.valuesTitles?.length) {
        const existing = currentValuesByFilterId.get(detail.id) ?? [];
        currentValuesByFilterId.set(
          detail.id,
          Array.from(new Set([...existing, ...detail.valuesTitles])),
        );
      }
    });
  });

  return enabledDataQueries?.map((dataQuery) => {
    const previousDataQuery = previousDataQueries?.find(
      (previousDataQuery) => previousDataQuery?.urn === dataQuery?.urn,
    );
    const { structures, conceptSchemes, codelists, dimensions } =
      getStructurePartsForDataQuery(dataQuery, datasetStructuresMap);

    const rawChanged = getUpdatedQueryFiltersDetails(
      getQueryFiltersDetails(
        previousDataQuery?.filters || [],
        dataQuery?.urn,
        dimensions,
        conceptSchemes,
        codelists,
        locale,
        datasetDimensionsMetadataMap,
      ),
      getQueryFiltersDetails(
        dataQuery?.filters ?? [],
        dataQuery?.urn,
        dimensions,
        conceptSchemes,
        codelists,
        locale,
        datasetDimensionsMetadataMap,
      ),
    );

    const queryFiltersDetails = rawChanged
      .map((detail) => {
        if (detail.valuesTitles?.length) return detail;
        const siblingValues = currentValuesByFilterId.get(detail.id);
        return siblingValues?.length
          ? { ...detail, valuesTitles: siblingValues }
          : null;
      })
      .filter((d): d is QueryFilterDetails => d !== null);

    return {
      datasetName: getLocalizedName(structures?.dataflows?.[0], locale),
      queryFiltersDetails,
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
  datasetUrn: string | undefined,
  dimensions: Dimension[],
  conceptSchemes: ConceptScheme[],
  codelists: Codelist[],
  locale: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
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
      id:
        getSharedFilterIdForDatasetDimension(
          datasetUrn,
          filter?.componentCode,
          datasetDimensionsMetadataMap,
        ) ?? filter?.componentCode,
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
    const periodFilter = dataQuery?.filters?.find(
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
