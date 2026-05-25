import {
  DataConstraints,
  DatasetQueryFilters,
  DatasetDimensionsMetadataMap,
  Dimension,
  findCodelistByDimension,
  getAnnotationPeriod,
  generateShortUrn,
  getAvailableCodesFromConstrains,
  SeriesFilterDto,
  StructuralData,
  StructuralMetaData,
  TIME_PERIOD_END_ANNOTATION_KEY,
  TIME_PERIOD_START_ANNOTATION_KEY,
  TIME_PERIOD,
} from '@epam/statgpt-sdmx-toolkit';
import {
  Filter,
  FiltersProps,
  FilterValue,
  FilterValueSource,
  SharedFilter,
} from '../models/filters';
import { getDatasetFilters, getFiltersPreselectedByDataQuery } from './filters';
import {
  DataQuery,
  Locale,
  QueryFilter,
  QueryFilterType,
  TimeRange,
} from '@epam/statgpt-shared-toolkit';
import { StructureDataMaps } from '../models/structure-data';
import { getFilledFilters } from './get-filled-filters';
import { getSeriesFilterDto } from './get-series-filters';
import { normalizeConstraintFilters } from './normalize-constraint-filters';
import {
  buildRequestCacheKey,
  getCachedRequestResult,
  isRequestCached,
} from './request-cache';
import { getQueryFilters, setDataQueryFilters } from './query-filters';

type SharedFilterConfig = {
  id: string;
  subtype?: string;
  getMergedValueKey: (value: FilterValue, datasetUrn?: string) => string;
};

export type ExtendedStructuralMetadata = {
  urn: string;
  data?: StructuralMetaData;
};

type SharedDimensionFilterState = {
  configId: string;
  dataQuery: DataQuery;
  dimensionId: string;
  filter?: QueryFilter;
  availableValues: string[];
};

export const COMMON_COUNTRY_FILTER_ID = 'COUNTRY';
export const COMMON_FREQUENCY_FILTER_ID = 'FREQUENCY';
export const COMMON_TIME_PERIOD_FILTER_ID = 'TIME_PERIOD';

export const SHARED_FILTER_IDS = new Set([
  COMMON_COUNTRY_FILTER_ID,
  COMMON_FREQUENCY_FILTER_ID,
  COMMON_TIME_PERIOD_FILTER_ID,
]);

const normalizeFilterId = (filterId?: string) =>
  filterId?.trim()?.toLocaleUpperCase();

const buildSharedFilterNameMatcher =
  (): SharedFilterConfig['getMergedValueKey'] => (value, datasetUrn) => {
    const normalizedName = value?.name?.trim()?.toLocaleLowerCase();

    return normalizedName
      ? buildMergedValueNameKey(normalizedName)
      : buildMergedValueDatasetKey(datasetUrn || '', value.id);
  };

const buildMergedValueNameKey = (name: string) => `name:${name}`;

const buildMergedValueDatasetKey = (datasetUrn: string, valueId: string) =>
  `dataset:${datasetUrn}:id:${valueId}`;

const getDatasetDimensionsMetadata = (
  datasetUrn?: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
) => (datasetUrn ? datasetDimensionsMetadataMap?.[datasetUrn] : undefined);

const getDatasetDimensionMetadata = (
  filter?: Filter,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
) => {
  if (filter?.filterType !== 'dataset' || !filter.id) {
    return undefined;
  }

  return getDatasetDimensionsMetadata(
    filter.datasetUrn,
    datasetDimensionsMetadataMap,
  )?.[filter.id];
};

const findDatasetDimensionKey = (
  datasetUrn: string,
  matcher: (dimensionMetadata: {
    subtype?: string | null;
    dimensionType?: string | null;
  }) => boolean,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): string | undefined =>
  Object.entries(
    getDatasetDimensionsMetadata(datasetUrn, datasetDimensionsMetadataMap) ||
      {},
  ).find(([, dimensionMetadata]) => matcher(dimensionMetadata))?.[0];

const getDatasetDimensionKeyBySubtype = (
  datasetUrn: string,
  subtype: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
) =>
  findDatasetDimensionKey(
    datasetUrn,
    (dimensionMetadata) => dimensionMetadata.subtype === subtype,
    datasetDimensionsMetadataMap,
  );

const getTimeDimensionKey = (
  datasetUrn: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
) =>
  findDatasetDimensionKey(
    datasetUrn,
    (dimensionMetadata) => dimensionMetadata.dimensionType === 'TIME_PERIOD',
    datasetDimensionsMetadataMap,
  );

const SHARED_FILTERS_CONFIG: SharedFilterConfig[] = [
  {
    id: COMMON_COUNTRY_FILTER_ID,
    subtype: 'REGION',
    getMergedValueKey: buildSharedFilterNameMatcher(),
  },
  {
    id: COMMON_FREQUENCY_FILTER_ID,
    subtype: 'FREQUENCY',
    getMergedValueKey: buildSharedFilterNameMatcher(),
  },
  {
    id: COMMON_TIME_PERIOD_FILTER_ID,
    getMergedValueKey: (value) => value.id,
  },
];

const SHARED_FILTERS_CONFIG_MAP = new Map<string, SharedFilterConfig>(
  SHARED_FILTERS_CONFIG.map((config) => [config.id, config]),
);

const getSharedFilterConfig = (filterId?: string) =>
  filterId
    ? SHARED_FILTERS_CONFIG_MAP.get(normalizeFilterId(filterId) || '')
    : void 0;

const isMatchingSharedFilterConfig = (
  filter: Filter,
  config: SharedFilterConfig,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
) => {
  if (filter.filterType === 'shared') {
    return config.id === normalizeFilterId(filter.id);
  }

  if (config.id === COMMON_TIME_PERIOD_FILTER_ID) {
    return (
      filter.isTimeDimension ||
      getDatasetDimensionMetadata(filter, datasetDimensionsMetadataMap)
        ?.dimensionType === 'TIME_PERIOD' ||
      config.id === normalizeFilterId(filter.id)
    );
  }

  const dimensionMetadata = getDatasetDimensionMetadata(
    filter,
    datasetDimensionsMetadataMap,
  );

  if (config.subtype && dimensionMetadata?.subtype === config.subtype) {
    return true;
  }

  return config.id === normalizeFilterId(filter.id);
};

const getSharedFilterConfigForFilter = (
  filter?: Filter,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
) =>
  filter
    ? SHARED_FILTERS_CONFIG.find((config) =>
        isMatchingSharedFilterConfig(
          filter,
          config,
          datasetDimensionsMetadataMap,
        ),
      )
    : undefined;

export const getSharedFilterIdForDatasetDimension = (
  datasetUrn?: string,
  dimensionId?: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): string | undefined => {
  if (!dimensionId) {
    return undefined;
  }

  const dimensionMetadata = datasetUrn
    ? datasetDimensionsMetadataMap?.[datasetUrn]?.[dimensionId]
    : undefined;

  if (dimensionMetadata?.dimensionType === 'TIME_PERIOD') {
    return COMMON_TIME_PERIOD_FILTER_ID;
  }

  const sharedConfigBySubtype = SHARED_FILTERS_CONFIG.find(
    (config) =>
      !!config.subtype && config.subtype === dimensionMetadata?.subtype,
  );

  return sharedConfigBySubtype?.id ?? getSharedFilterConfig(dimensionId)?.id;
};

const isSharedFilterId = (filterId?: string) =>
  !!getSharedFilterConfig(filterId);

const isSharedFilter = (filter?: Filter): filter is SharedFilter =>
  filter?.filterType === 'shared' && isSharedFilterId(filter?.id);

const hasConstraintsForDataset = (
  constraintsMap: Map<string, DataConstraints[] | undefined> | undefined,
  datasetUrn: string,
) => !constraintsMap || Array.isArray(constraintsMap.get(datasetUrn));

const hasDataMessageForDataset = (
  structureDataMaps: StructureDataMaps | undefined,
  datasetUrn: string,
) =>
  !structureDataMaps?.dataMessagesMap ||
  structureDataMaps.dataMessagesMap.has(datasetUrn);

const mergeSharedFilterValues = (
  filters: Filter[],
  config: SharedFilterConfig,
): FilterValue[] => {
  const valueMap = new Map<string, FilterValue>();

  filters.forEach((filter) => {
    filter.dimensionValues?.forEach((value) => {
      const mergeKey = config.getMergedValueKey(value, filter.datasetUrn);
      const sourceValue: FilterValueSource = {
        datasetUrn: filter.datasetUrn,
        id: value.id,
        name: value.name,
        parent: value.parent,
      };
      const existingValue = valueMap.get(mergeKey);

      if (existingValue) {
        existingValue.isSelectedValue =
          existingValue.isSelectedValue || value.isSelectedValue;
        existingValue.sourceValues = [
          ...(existingValue.sourceValues || []),
          sourceValue,
        ];
        return;
      }

      valueMap.set(mergeKey, {
        id: mergeKey,
        name: value.name,
        isSelectedValue: value.isSelectedValue,
        parent: value.parent,
        sourceValues: [sourceValue],
      });
    });
  });

  return Array.from(valueMap.values());
};

const mergeSharedFilters = (
  filters: Filter[],
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): Filter[] => {
  const groupedFilters = new Map<string, Filter[]>();
  const otherFilters: Filter[] = [];

  filters.forEach((filter) => {
    const config = getSharedFilterConfigForFilter(
      filter,
      datasetDimensionsMetadataMap,
    );

    if (config && filter?.datasetUrn) {
      const group = groupedFilters.get(config.id) || [];
      groupedFilters.set(config.id, [...group, filter]);
      return;
    }

    otherFilters.push(filter);
  });

  const sharedFilters = SHARED_FILTERS_CONFIG.flatMap((config) => {
    const grouped = groupedFilters.get(config.id);

    if (!grouped?.length) {
      return [];
    }

    const sharedFilter: Filter = {
      ...grouped[0],
      id: config.id,
      datasetUrn: void 0,
      filterType: 'shared',
      sourceDatasetUrns: Array.from(
        new Set(
          grouped
            .map((filter) => filter.datasetUrn)
            .filter((datasetUrn): datasetUrn is string => !!datasetUrn),
        ),
      ),
      sourceFilterIdsByDataset: Object.fromEntries(
        grouped.flatMap((filter) =>
          filter.datasetUrn && filter.id
            ? [[filter.datasetUrn, filter.id]]
            : [],
        ),
      ),
      dimensionValues: mergeSharedFilterValues(grouped, config),
    };

    if (sharedFilter.isTimeDimension) {
      sharedFilter.timeRange = getMergedSharedTimeRange(grouped);
    }

    return sharedFilter;
  });

  return [...sharedFilters, ...otherFilters];
};

const getNativeFilterIdForSharedFilter = (
  filter: SharedFilter,
  datasetUrn: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): string | undefined => {
  const sourceFilterId = filter.sourceFilterIdsByDataset?.[datasetUrn];

  if (sourceFilterId) {
    return sourceFilterId;
  }

  if (filter.id === COMMON_TIME_PERIOD_FILTER_ID) {
    return getTimeDimensionKey(datasetUrn, datasetDimensionsMetadataMap);
  }

  const config = getSharedFilterConfig(filter.id);
  return config?.subtype
    ? getDatasetDimensionKeyBySubtype(
        datasetUrn,
        config.subtype,
        datasetDimensionsMetadataMap,
      )
    : undefined;
};

const toDatasetFilter = (
  filter: SharedFilter,
  datasetUrn: string,
  dimensionValues?: FilterValue[],
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): Filter => ({
  ...filter,
  id:
    getNativeFilterIdForSharedFilter(
      filter,
      datasetUrn,
      datasetDimensionsMetadataMap,
    ) || filter.id,
  datasetUrn,
  filterType: 'dataset',
  ...(dimensionValues ? { dimensionValues } : {}),
});

const expandSharedTimeFilter = (
  filter: SharedFilter,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): Filter[] =>
  (filter.sourceDatasetUrns || []).map((datasetUrn) =>
    toDatasetFilter(
      filter,
      datasetUrn,
      undefined,
      datasetDimensionsMetadataMap,
    ),
  );

const mapSharedValueToDatasetValue = (
  value: FilterValue,
  sourceValue: FilterValueSource,
): FilterValue => ({
  id: sourceValue.id,
  name: sourceValue.name,
  parent: sourceValue.parent,
  isSelectedValue: value.isSelectedValue,
});

const mapSharedDimensionValuesByDataset = (
  filter: SharedFilter,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): Map<string, Filter> => {
  const datasetFiltersMap = new Map<string, Filter>();

  filter.dimensionValues?.forEach((value) => {
    value.sourceValues?.forEach((sourceValue) => {
      const datasetUrn = sourceValue.datasetUrn || '';
      const existingFilter = datasetFiltersMap.get(datasetUrn);
      const mappedValue = mapSharedValueToDatasetValue(value, sourceValue);

      if (existingFilter) {
        existingFilter.dimensionValues = [
          ...(existingFilter.dimensionValues || []),
          mappedValue,
        ];
        return;
      }

      datasetFiltersMap.set(
        datasetUrn,
        toDatasetFilter(
          filter,
          datasetUrn,
          [mappedValue],
          datasetDimensionsMetadataMap,
        ),
      );
    });
  });

  return datasetFiltersMap;
};

const expandSharedFilter = (
  filter: Filter,
  _propagateSharedFiltersToAllDatasets = false,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): Filter[] => {
  if (!isSharedFilter(filter)) {
    return [filter];
  }

  if (filter.isTimeDimension) {
    return expandSharedTimeFilter(filter, datasetDimensionsMetadataMap);
  }

  const datasetFiltersMap = mapSharedDimensionValuesByDataset(
    filter,
    datasetDimensionsMetadataMap,
  );

  return Array.from(datasetFiltersMap.values());
};

const getMergedSharedTimeRange = (filters: Filter[]): TimeRange | undefined => {
  const startPeriods = filters
    .map((filter) => filter.timeRange?.startPeriod)
    .filter((date): date is Date => !!date);
  const endPeriods = filters
    .map((filter) => filter.timeRange?.endPeriod)
    .filter((date): date is Date => !!date);

  if (!startPeriods.length || !endPeriods.length) {
    return void 0;
  }

  return {
    startPeriod: new Date(
      Math.min(...startPeriods.map((period) => period.getTime())),
    ),
    endPeriod: new Date(
      Math.max(...endPeriods.map((period) => period.getTime())),
    ),
  };
};

const limitTimeRangeByConstraints = (
  filter: Filter,
  constraints?: DataConstraints[],
): Filter => {
  if (!filter.isTimeDimension || !filter.timeRange) {
    return filter;
  }

  const annotationTimeRange = getAnnotationPeriod(
    constraints?.[0]?.annotations,
  );
  const minPeriod = annotationTimeRange.startPeriod;
  const maxPeriod = annotationTimeRange.endPeriod;

  if (!minPeriod || !maxPeriod) {
    return filter;
  }

  const { startPeriod: requestedStart, endPeriod: requestedEnd } =
    filter.timeRange;

  const isBeforeAvailableRange = requestedEnd && requestedEnd < minPeriod;

  if (isBeforeAvailableRange) {
    return {
      ...filter,
      timeRange: {
        startPeriod: new Date(minPeriod),
        endPeriod: new Date(minPeriod),
      },
    };
  }

  const isAfterAvailableRange = requestedStart && requestedStart > maxPeriod;

  if (isAfterAvailableRange) {
    return {
      ...filter,
      timeRange: {
        startPeriod: new Date(maxPeriod),
        endPeriod: new Date(maxPeriod),
      },
    };
  }

  return {
    ...filter,
    timeRange: {
      startPeriod: requestedStart
        ? new Date(Math.max(requestedStart.getTime(), minPeriod.getTime()))
        : new Date(minPeriod),
      endPeriod: requestedEnd
        ? new Date(Math.min(requestedEnd.getTime(), maxPeriod.getTime()))
        : new Date(maxPeriod),
    },
  };
};

const getDatasetFiltersMapFromMultipleQueries = (
  structureDataMaps?: StructureDataMaps,
  locale?: string,
): Map<string, Filter[]> => {
  if (!structureDataMaps?.dimensionsMap) {
    return new Map<string, Filter[]>();
  }

  return new Map(
    Array.from(structureDataMaps.dimensionsMap.entries()).map(
      ([datasetUrn, dimensions]) => [
        datasetUrn,
        getDatasetFilters(
          dimensions,
          structureDataMaps?.structuresMap?.get(datasetUrn),
          structureDataMaps?.structureDimensionsMap?.get(datasetUrn),
          locale,
          datasetUrn,
        ),
      ],
    ),
  );
};

const getFiltersWithValuesMap = (
  structureDataMaps?: StructureDataMaps,
  locale?: string,
  requireDataMessages = true,
) => {
  return new Map(
    Array.from(structureDataMaps?.dimensionsMap?.entries() || []).map(
      ([datasetUrn, dimensions]) => {
        const hasDatasetConstraints = hasConstraintsForDataset(
          structureDataMaps?.constraintsMap,
          datasetUrn,
        );
        const hasDatasetDataMessage = hasDataMessageForDataset(
          structureDataMaps,
          datasetUrn,
        );
        const filters =
          dimensions?.map((dimension) => {
            if (
              !hasDatasetConstraints ||
              (requireDataMessages && !hasDatasetDataMessage)
            ) {
              return {
                ...dimension,
                dimensionValues: [],
              };
            }

            const codeList = findCodelistByDimension(
              structureDataMaps?.structuresMap?.get(datasetUrn)?.codelists,
              structureDataMaps?.structuresMap?.get(datasetUrn)?.conceptSchemes,
              dimension,
            );
            const availableTerms = getAvailableCodesFromConstrains(
              codeList?.codes,
              dimension.id,
              structureDataMaps?.constraintsMap?.get(datasetUrn),
              locale,
            );
            return {
              ...dimension,
              dimensionValues: availableTerms,
            };
          }) || [];
        return [datasetUrn, filters];
      },
    ),
  );
};

const getFiltersWithSelectedValuesOnly = (filters: Filter[]): Filter[] =>
  filters.map((filter) => ({
    ...filter,
    isDisabled: false,
    dimensionValues:
      filter.dimensionValues?.filter((value) => value.isSelectedValue) || [],
  }));

export const getFilledDatasetFiltersMap = (
  structureDataMaps?: StructureDataMaps,
  locale?: string,
  requireDataMessages = true,
) => {
  const datasetFiltersMap = getDatasetFiltersMapFromMultipleQueries(
    structureDataMaps,
    locale,
  );
  const filledDimensionsMap = getFiltersWithValuesMap(
    structureDataMaps,
    locale,
    requireDataMessages,
  );

  return new Map(
    Array.from(datasetFiltersMap?.entries() || []).map(
      ([datasetUrn, filters]) => {
        const filledDimensions = filledDimensionsMap?.get(datasetUrn);
        const filledDatasetFilters = filters.map((filter) => {
          return {
            ...filter,
            dimensionValues:
              filledDimensions?.find((dimension) => dimension.id === filter.id)
                ?.dimensionValues || [],
          };
        });
        return [datasetUrn, filledDatasetFilters];
      },
    ),
  );
};

export const getFiltersPreselectedByDataQueries = (
  filtersMap: Map<string, Filter[]>,
  dataQueries?: DataQuery[],
  constraintsMap?: Map<string, DataConstraints[] | undefined>,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): Filter[] => {
  const hasExplicitSharedSelectionInOtherDataset = (
    currentDataQuery: DataQuery,
    config: SharedFilterConfig,
  ) =>
    dataQueries?.some(
      (dataQuery) =>
        dataQuery.urn !== currentDataQuery.urn &&
        dataQuery.filters?.some((queryFilter) => {
          if (
            queryFilter.operator === QueryFilterType.BETWEEN ||
            !queryFilter.values?.length
          ) {
            return false;
          }

          const queryFilterConfig = getSharedFilterConfigForFilter(
            {
              id: queryFilter.componentCode,
              datasetUrn: dataQuery.urn,
              filterType: 'dataset',
            },
            datasetDimensionsMetadataMap,
          );

          return queryFilterConfig?.id === config.id;
        }),
    ) ?? false;

  return mergeSharedFilters(
    dataQueries?.flatMap((dataQuery) => {
      const urn = dataQuery?.urn;
      const filters = filtersMap?.get(urn) || [];
      const constraints = constraintsMap?.get(urn) || [];
      const preselected = getFiltersPreselectedByDataQuery(
        filters,
        dataQuery,
        constraints,
      );

      return preselected.map((filter) => {
        if (filter.isTimeDimension || filter.filterType !== 'dataset') {
          return filter;
        }

        const config = getSharedFilterConfigForFilter(
          filter,
          datasetDimensionsMetadataMap,
        );
        if (!config || config.id === COMMON_TIME_PERIOD_FILTER_ID) {
          return filter;
        }

        const hasExplicitFilter = dataQuery.filters?.some(
          (f) =>
            f.componentCode === filter.id &&
            f.operator !== QueryFilterType.BETWEEN,
        );
        if (hasExplicitFilter) {
          return filter;
        }

        if (!hasExplicitSharedSelectionInOtherDataset(dataQuery, config)) {
          return filter;
        }

        const hasAnySelected = filter.dimensionValues?.some(
          (v) => v.isSelectedValue,
        );
        if (hasAnySelected) {
          return filter;
        }

        return {
          ...filter,
          dimensionValues: filter.dimensionValues?.map((v) => ({
            ...v,
            isSelectedValue: true,
          })),
        };
      });
    }) || [],
    datasetDimensionsMetadataMap,
  );
};

export const buildFiltersMap = (
  filters: Filter[],
  constraintsMap?: Map<string, DataConstraints[] | undefined>,
  applySharedFallback = false,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
  disabledDatasetUrns: Set<string> = new Set(),
): Map<string, Filter[]> => {
  const result = filters
    ?.flatMap((filter) =>
      expandSharedFilter(
        filter,
        applySharedFallback,
        datasetDimensionsMetadataMap,
      ),
    )
    ?.reduce((filterMap, filter) => {
      const urn = filter?.datasetUrn || '';
      const filterWithLimitedTimeRange = limitTimeRangeByConstraints(
        filter,
        constraintsMap?.get(urn),
      );
      if (!filterMap.has(urn)) {
        filterMap.set(urn, []);
      }
      filterMap?.get(urn)?.push(filterWithLimitedTimeRange);

      return filterMap;
    }, new Map<string, Filter[]>());

  // Remove disabled datasets so their DataQuery.filters survive the Apply cycle
  // untouched (they are preserved via the `...q` spread in updatedDataQueries).
  if (disabledDatasetUrns.size > 0) {
    for (const urn of disabledDatasetUrns) {
      result.delete(urn);
    }
  }

  return result;
};

export const getCompatibleDatasetUrns = (
  filters: Filter[],
  dataQueryUrns: string[],
  dataQueries?: DataQuery[],
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
  appliedFiltersMap?: Map<string, Filter[]>,
): Set<string> => {
  const sharedFiltersWithSelections = filters.filter(
    (f): f is SharedFilter =>
      f.filterType === 'shared' &&
      !f.isTimeDimension &&
      (f.dimensionValues?.some((v) => v.isSelectedValue) ?? false),
  );

  if (!sharedFiltersWithSelections.length) {
    return new Set(dataQueryUrns);
  }

  const hasImplicitWildcardForSharedFilter = (
    datasetUrn: string,
    filter: SharedFilter,
  ): boolean => {
    const nativeFilterId = getNativeFilterIdForSharedFilter(
      filter,
      datasetUrn,
      datasetDimensionsMetadataMap,
    );

    if (!nativeFilterId) {
      return false;
    }

    if (appliedFiltersMap) {
      const datasetFilters = appliedFiltersMap.get(datasetUrn) ?? [];
      const matchingFilter = datasetFilters.find(
        (f) => f.id === nativeFilterId,
      );
      if (!matchingFilter) {
        return true;
      }
      return false;
    }

    const dataQuery = dataQueries?.find((query) => query.urn === datasetUrn);

    if (!dataQuery) {
      return false;
    }

    return !dataQuery.filters?.some(
      (queryFilter) =>
        queryFilter.componentCode === nativeFilterId &&
        queryFilter.operator !== QueryFilterType.BETWEEN,
    );
  };

  return new Set(
    dataQueryUrns.filter((urn) =>
      sharedFiltersWithSelections.every(
        (filter) =>
          filter.dimensionValues?.some(
            (v) =>
              v.isSelectedValue &&
              v.sourceValues?.some((sv) => sv.datasetUrn === urn),
          ) || hasImplicitWildcardForSharedFilter(urn, filter),
      ),
    ),
  );
};

export const filterDataQueriesByActiveDatasetUrns = (
  dataQueries: DataQuery[] | undefined,
  activeDatasetUrns: Set<string> | null,
): DataQuery[] => {
  if (!activeDatasetUrns) {
    return dataQueries || [];
  }

  return (dataQueries || []).filter((dataQuery) =>
    activeDatasetUrns.has(dataQuery.urn),
  );
};

export const filterMapByActiveDatasetUrns = <T>(
  map: Map<string, T>,
  activeDatasetUrns: Set<string> | null,
): Map<string, T> => {
  if (!activeDatasetUrns) {
    return map;
  }

  return new Map(
    [...map].filter(([datasetUrn]) => activeDatasetUrns.has(datasetUrn)),
  );
};

export const getRestoredActiveDatasetUrns = (
  dataQueries?: DataQuery[],
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): string[] | undefined => {
  const selectedSharedFilterDatasetUrnsMap = new Map<string, Set<string>>();

  dataQueries?.forEach((dataQuery) => {
    dataQuery.filters?.forEach((queryFilter) => {
      if (
        queryFilter.operator === QueryFilterType.BETWEEN ||
        !queryFilter.values?.length
      ) {
        return;
      }

      const config = getSharedFilterConfigForFilter(
        {
          id: queryFilter.componentCode,
          datasetUrn: dataQuery.urn,
          filterType: 'dataset',
        },
        datasetDimensionsMetadataMap,
      );

      if (!config || config.id === COMMON_TIME_PERIOD_FILTER_ID) {
        return;
      }

      const datasetUrns =
        selectedSharedFilterDatasetUrnsMap.get(config.id) ?? new Set<string>();
      datasetUrns.add(dataQuery.urn);
      selectedSharedFilterDatasetUrnsMap.set(config.id, datasetUrns);
    });
  });

  if (!selectedSharedFilterDatasetUrnsMap.size) {
    return undefined;
  }

  return (
    dataQueries
      ?.filter((dataQuery) =>
        Array.from(selectedSharedFilterDatasetUrnsMap.values()).every(
          (datasetUrns) => datasetUrns.has(dataQuery.urn),
        ),
      )
      .map((dataQuery) => dataQuery.urn) ?? []
  );
};

const getConstraintDimensionValues = (
  constraints: DataConstraints[] | undefined,
  dimensionId: string | undefined,
): string[] => {
  if (!dimensionId) {
    return [];
  }

  return Array.from(
    new Set(
      constraints?.flatMap(
        (constraint) =>
          constraint.cubeRegions
            ?.filter((cubeRegion) => cubeRegion.isIncluded)
            .flatMap(
              (cubeRegion) =>
                cubeRegion.memberSelection
                  ?.filter((selection) => selection.componentId === dimensionId)
                  .flatMap((selection) =>
                    selection.selectionValues.map((value) => value.memberValue),
                  ) ?? [],
            ) ?? [],
      ) ?? [],
    ),
  );
};

export const getDataQueriesWithExpandedSharedDimensionFilters = (
  dataQueries: DataQuery[],
  constraintsMap: Map<string, DataConstraints[] | undefined> | undefined,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): DataQuery[] => {
  if (dataQueries.length < 2 || !constraintsMap) {
    return dataQueries;
  }

  const sharedDimensionStates: SharedDimensionFilterState[] =
    dataQueries.flatMap((dataQuery) =>
      SHARED_FILTERS_CONFIG.flatMap((config) => {
        if (!config.subtype) {
          return [];
        }

        const dimensionId = getDatasetDimensionKeyBySubtype(
          dataQuery.urn,
          config.subtype,
          datasetDimensionsMetadataMap,
        );

        if (!dimensionId) {
          return [];
        }

        return [
          {
            configId: config.id,
            dataQuery,
            dimensionId,
            filter: dataQuery.filters?.find(
              (queryFilter) =>
                queryFilter.componentCode === dimensionId &&
                queryFilter.operator !== QueryFilterType.BETWEEN,
            ),
            availableValues: getConstraintDimensionValues(
              constraintsMap.get(dataQuery.urn),
              dimensionId,
            ),
          },
        ];
      }),
    );

  const statesByConfigId = new Map<string, SharedDimensionFilterState[]>();
  sharedDimensionStates.forEach((state) => {
    statesByConfigId.set(state.configId, [
      ...(statesByConfigId.get(state.configId) ?? []),
      state,
    ]);
  });

  const expandedValuesByFilter = new Map<QueryFilter, string[]>();
  statesByConfigId.forEach((states) => {
    const explicitStates = states.filter(
      (state) => state.filter?.values?.length,
    );
    const missingStates = states.filter((state) => !state.filter);
    if (!explicitStates.length || !missingStates.length) {
      return;
    }

    const implicitValues = new Set(
      missingStates.flatMap((state) => state.availableValues),
    );
    if (!implicitValues.size) {
      return;
    }

    explicitStates.forEach((state) => {
      const filter = state.filter;
      if (!filter?.values?.length) {
        return;
      }

      const availableValues = new Set(state.availableValues);
      const expandedValues = Array.from(
        new Set([
          ...filter.values,
          ...Array.from(implicitValues).filter((value) =>
            availableValues.has(value),
          ),
        ]),
      );

      if (expandedValues.length > filter.values.length) {
        expandedValuesByFilter.set(filter, expandedValues);
      }
    });
  });

  if (!expandedValuesByFilter.size) {
    return dataQueries;
  }

  return dataQueries.map((dataQuery) => {
    let hasExpandedFilters = false;
    const filters = dataQuery.filters?.map((queryFilter) => {
      const expandedValues = expandedValuesByFilter.get(queryFilter);
      if (!expandedValues) {
        return queryFilter;
      }

      hasExpandedFilters = true;
      return {
        ...queryFilter,
        values: expandedValues,
      };
    });

    return hasExpandedFilters
      ? {
          ...dataQuery,
          filters,
        }
      : dataQuery;
  });
};

export const getCrossDatasetSnapshotKey = (dataQueries?: DataQuery[]) =>
  JSON.stringify(
    dataQueries?.map((dataQuery) => ({
      urn: dataQuery.urn,
      filters: dataQuery.filters ?? [],
    })) ?? [],
  );

export const getFiltersByConstraints = (
  filtersMap: Map<string, Filter[]>,
  structureDataMaps?: StructureDataMaps,
  locale = Locale.EN,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): Filter[] => {
  const updatedFilters: Filter[] = [];
  Array.from(filtersMap?.entries())?.forEach(([datasetUrn, filters]) => {
    const dimensions = structureDataMaps?.dimensionsMap?.get(datasetUrn);
    const structures = structureDataMaps?.structuresMap?.get(datasetUrn);
    const hasDatasetConstraints = hasConstraintsForDataset(
      structureDataMaps?.constraintsMap,
      datasetUrn,
    );
    const hasDatasetDataMessage = hasDataMessageForDataset(
      structureDataMaps,
      datasetUrn,
    );

    if (!hasDatasetConstraints || !hasDatasetDataMessage) {
      updatedFilters.push(...getFiltersWithSelectedValuesOnly(filters));
      return;
    }

    const constraints = structureDataMaps?.constraintsMap?.get(datasetUrn);

    updatedFilters.push(
      ...getFilledFilters(filters, dimensions, structures, constraints, locale),
    );
  });

  return mergeSharedFilters(updatedFilters, datasetDimensionsMetadataMap);
};

export const getFiltersForQueryContext = (
  filters: Filter[],
  datasetUrn?: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): Filter[] => {
  if (!datasetUrn) {
    return filters.filter((filter) => filter.filterType !== 'shared');
  }

  return (
    buildFiltersMap(
      filters,
      undefined,
      false,
      datasetDimensionsMetadataMap,
    ).get(datasetUrn) || []
  );
};

export const getDatasetNameFromFilters = (
  filter: Filter,
  structuresMap?: Map<string, StructuralData | undefined>,
): string | undefined => {
  if (filter?.filterType === 'shared') {
    return void 0;
  }

  const dataset = filter?.datasetUrn
    ? structuresMap?.get(filter.datasetUrn)?.dataflows?.[0]
    : void 0;

  return dataset
    ? generateShortUrn(dataset?.name, '', dataset?.agencyID)
    : void 0;
};

export const isStructureDataMapsReady = (
  dataQueries?: FiltersProps['dataQueries'],
  structureDataMaps?: FiltersProps['structureDataMaps'],
) => {
  if (!dataQueries?.length) {
    return false;
  }

  return (
    !!structureDataMaps?.dimensionsMap &&
    !!structureDataMaps?.structuresMap &&
    !!structureDataMaps?.structureDimensionsMap &&
    !!structureDataMaps?.constraintsMap
  );
};

const getConstraintFilters = (
  attachmentUrn: string,
  sourceFilters: Filter[],
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): SeriesFilterDto[] => {
  const hasMergedSharedFilters = sourceFilters.some(
    (filter) => filter.filterType === 'shared',
  );
  const filtersForConstraint = hasMergedSharedFilters
    ? sourceFilters.filter((filter) => {
        const config = getSharedFilterConfigForFilter(
          filter,
          datasetDimensionsMetadataMap,
        );
        return !config || config.id === COMMON_TIME_PERIOD_FILTER_ID;
      })
    : sourceFilters;

  return normalizeConstraintFilters(
    getSeriesFilterDto(
      filtersForConstraint,
      attachmentUrn,
      datasetDimensionsMetadataMap,
    ).filter((filter) => filter.componentCode !== TIME_PERIOD),
  );
};

export const getConstraintsRequests = (
  dataQueries?: DataQuery[],
  filtersMap?: Map<string, Filter[]>,
  actions?: {
    getConstraints: (
      urn: string,
      filters?: SeriesFilterDto[],
    ) => Promise<StructuralMetaData>;
  },
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
  filters?: Filter[],
): Promise<ExtendedStructuralMetadata>[] => {
  return (
    dataQueries?.map((dataQuery) => {
      const attachmentUrn = dataQuery?.urn ?? '';
      const sourceFilters = filters ?? filtersMap?.get(attachmentUrn) ?? [];
      const constraintFilters = getConstraintFilters(
        attachmentUrn,
        sourceFilters,
        datasetDimensionsMetadataMap,
      );

      return actions
        ? getCachedRequestResult(
            actions.getConstraints,
            buildRequestCacheKey(attachmentUrn, constraintFilters),
            () => actions.getConstraints(attachmentUrn, constraintFilters),
          ).then((data) => ({ urn: attachmentUrn, data }))
        : Promise.resolve({
            urn: attachmentUrn,
            data: {} as StructuralMetaData,
          });
    }) || []
  );
};

export const hasUncachedConstraintRequests = (
  dataQueries?: DataQuery[],
  filtersMap?: Map<string, Filter[]>,
  actions?: {
    getConstraints: (
      urn: string,
      filters?: SeriesFilterDto[],
    ) => Promise<StructuralMetaData>;
  },
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
  filters?: Filter[],
): boolean => {
  if (!actions?.getConstraints || !dataQueries?.length) return false;

  return dataQueries.some((dataQuery) => {
    const attachmentUrn = dataQuery?.urn ?? '';
    const sourceFilters = filters ?? filtersMap?.get(attachmentUrn) ?? [];
    const constraintFilters = getConstraintFilters(
      attachmentUrn,
      sourceFilters,
      datasetDimensionsMetadataMap,
    );

    return !isRequestCached(
      actions.getConstraints,
      buildRequestCacheKey(attachmentUrn, constraintFilters),
    );
  });
};

export const hasImplicitSharedWildcard = (
  dataQueries: DataQuery[],
  structureDataMaps: StructureDataMaps,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): boolean => {
  if (dataQueries.length < 2) return false;

  const sharedFilterStateById = new Map<
    string,
    {
      datasetsWithExplicitValues: Set<string>;
      datasetsWithMissingFilter: Set<string>;
    }
  >();

  for (const dataQuery of dataQueries) {
    const dimensions = structureDataMaps.dimensionsMap?.get(dataQuery.urn);
    if (!dimensions) continue;

    for (const dimension of dimensions) {
      const dimensionId = dimension.id;
      if (!dimensionId) continue;

      const metadata =
        datasetDimensionsMetadataMap?.[dataQuery.urn]?.[dimensionId];
      const subtype = metadata?.subtype;
      if (!subtype || metadata?.dimensionType === 'TIME_PERIOD') continue;

      const config = SHARED_FILTERS_CONFIG.find((c) => c.subtype === subtype);
      if (!config) continue;

      const state = sharedFilterStateById.get(config.id) ?? {
        datasetsWithExplicitValues: new Set<string>(),
        datasetsWithMissingFilter: new Set<string>(),
      };

      const matchingFilter = dataQuery.filters?.find(
        (f) =>
          f.componentCode === dimensionId &&
          f.operator !== QueryFilterType.BETWEEN,
      );

      if (!matchingFilter) {
        state.datasetsWithMissingFilter.add(dataQuery.urn);
      } else if (matchingFilter.values?.length) {
        state.datasetsWithExplicitValues.add(dataQuery.urn);
      }

      sharedFilterStateById.set(config.id, state);
    }
  }

  return [...sharedFilterStateById.values()].some((state) =>
    [...state.datasetsWithMissingFilter].some((missingDatasetUrn) =>
      [...state.datasetsWithExplicitValues].some(
        (explicitDatasetUrn) => explicitDatasetUrn !== missingDatasetUrn,
      ),
    ),
  );
};

export const getConstraintsMap = (
  constraintsData: ExtendedStructuralMetadata[],
): Map<string, DataConstraints[] | undefined> => {
  return new Map(
    constraintsData?.flatMap(({ urn, data }) => {
      const constraints = data?.data?.dataConstraints;
      return Array.isArray(constraints) ? [[urn, constraints]] : [];
    }),
  );
};

export const getConstraintsMapFromSettledResults = (
  constraintsResults: PromiseSettledResult<ExtendedStructuralMetadata>[],
): Map<string, DataConstraints[] | undefined> =>
  getConstraintsMap(
    constraintsResults.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    ),
  );

export const mergeConstraintsMaps = (
  baseConstraintsMap: Map<string, DataConstraints[] | undefined> | undefined,
  updatedConstraintsMap: Map<string, DataConstraints[] | undefined>,
): Map<string, DataConstraints[] | undefined> => {
  const mergedConstraintsMap = new Map(baseConstraintsMap);

  updatedConstraintsMap.forEach((constraints, datasetUrn) => {
    mergedConstraintsMap.set(datasetUrn, constraints);
  });

  return mergedConstraintsMap;
};

export const getInitialConstraints = (
  isCrossDatasetModeOn: boolean,
  filter?: Filter,
  initialConstraints?: DataConstraints[],
  initialConstraintsMap?: Map<string, DataConstraints[] | undefined>,
): DataConstraints[] => {
  if (
    isCrossDatasetModeOn &&
    filter?.filterType === 'shared' &&
    filter?.isTimeDimension
  ) {
    const allConstraints = Array.from(
      initialConstraintsMap?.values() || [],
    ).flatMap((constraints) => constraints || []);
    const allRanges = allConstraints
      .map((constraint) => getAnnotationPeriod(constraint?.annotations))
      .filter(
        (range): range is { startPeriod: Date; endPeriod: Date } =>
          range.startPeriod !== null && range.endPeriod !== null,
      );

    if (!allRanges.length) {
      return [];
    }

    const startPeriod = new Date(
      Math.min(...allRanges.map((range) => range.startPeriod.getTime())),
    );
    const endPeriod = new Date(
      Math.max(...allRanges.map((range) => range.endPeriod.getTime())),
    );

    return [
      {
        id: filter.id || TIME_PERIOD,
        annotations: [
          {
            id: TIME_PERIOD_START_ANNOTATION_KEY,
            title: startPeriod.toISOString(),
          },
          {
            id: TIME_PERIOD_END_ANNOTATION_KEY,
            title: endPeriod.toISOString(),
          },
        ],
      } as DataConstraints,
    ];
  }

  return isCrossDatasetModeOn
    ? (initialConstraintsMap?.get(filter?.datasetUrn ?? '') ?? [])
    : (initialConstraints ?? []);
};

export const getQueryFiltersMap = (
  filtersMap: Map<string, Filter[]>,
  dataQueries?: DataQuery[],
  dimensionsMap?: Map<string, Dimension[]>,
): Map<string, DatasetQueryFilters> => {
  return new Map(
    dataQueries?.map((dataQuery) => {
      const datasetUrn = dataQuery?.urn;
      return [
        datasetUrn,
        getQueryFilters(
          filtersMap.get(datasetUrn) || [],
          dimensionsMap?.get(datasetUrn),
        ),
      ];
    }),
  );
};

export const getImplicitSharedWildcardFilterParams = (
  dataQueries: DataQuery[],
  structureDataMaps: StructureDataMaps,
  constraintsMap: Map<string, DataConstraints[] | undefined> | undefined,
  locale: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
):
  | {
      compatibleUrns: Set<string>;
      filterParamsMap: Map<string, DatasetQueryFilters>;
    }
  | undefined => {
  const hasImplicitWildcard = hasImplicitSharedWildcard(
    dataQueries,
    structureDataMaps,
    datasetDimensionsMetadataMap,
  );

  if (!constraintsMap || !dataQueries.length || !hasImplicitWildcard) {
    return undefined;
  }

  const structureDataMapsWithConstraints = {
    ...structureDataMaps,
    constraintsMap,
  };
  const filledDatasetFiltersMap = getFilledDatasetFiltersMap(
    structureDataMapsWithConstraints,
    locale,
    false,
  );
  const preselectedFilters = getFiltersPreselectedByDataQueries(
    filledDatasetFiltersMap,
    dataQueries,
    constraintsMap,
    datasetDimensionsMetadataMap,
  );
  const expandedFiltersMap = buildFiltersMap(
    preselectedFilters,
    constraintsMap,
    false,
    datasetDimensionsMetadataMap,
  );
  const compatibleUrns = getCompatibleDatasetUrns(
    preselectedFilters,
    dataQueries.map((dataQuery) => dataQuery.urn),
    dataQueries,
    datasetDimensionsMetadataMap,
    expandedFiltersMap,
  );
  const compatibleDataQueries = dataQueries.filter((dataQuery) =>
    compatibleUrns.has(dataQuery.urn),
  );

  return {
    compatibleUrns,
    filterParamsMap: getQueryFiltersMap(
      expandedFiltersMap,
      compatibleDataQueries,
      structureDataMaps.dimensionsMap,
    ),
  };
};

export const setDataQueryFiltersMap = (
  dataQueries?: DataQuery[],
  filtersMap?: Map<string, Filter[]>,
): Map<string, QueryFilter[]> => {
  return new Map(
    dataQueries?.map((dataQuery) => {
      const datasetUrn = dataQuery?.urn;
      return [
        datasetUrn,
        setDataQueryFilters(filtersMap?.get(datasetUrn) || []),
      ];
    }),
  );
};

/**
 * Filters a Time Period SharedFilter for enabled datasets.
 * Handles: filtering sourceDatasetUrns to enabled ones, hiding the
 * facet entirely when all source datasets are disabled, recomputing the
 * available range from enabled datasets' constraints and clipping the
 * user's timeRange selection accordingly.
 */
const filterTimeDimensionForEnabledDatasets = (
  filter: SharedFilter,
  disabledDatasetUrns: Set<string>,
  constraintsMap?: Map<string, DataConstraints[] | undefined>,
): Filter[] => {
  const enabledSourceUrns = (filter.sourceDatasetUrns ?? []).filter(
    (urn) => !disabledDatasetUrns.has(urn),
  );

  if (enabledSourceUrns.length === 0) return [];

  if (!constraintsMap || !filter.timeRange) {
    return [{ ...filter, sourceDatasetUrns: enabledSourceUrns }];
  }

  // Compute the union of available ranges from enabled datasets' constraints
  const periods = enabledSourceUrns
    .map((urn) => getAnnotationPeriod(constraintsMap.get(urn)?.[0]?.annotations))
    .filter(
      (p): p is { startPeriod: Date; endPeriod: Date } =>
        !!(p?.startPeriod) && !!(p?.endPeriod),
    );

  if (periods.length === 0) {
    // Constraints not available yet — keep filter with enabled URNs, no clipping
    return [{ ...filter, sourceDatasetUrns: enabledSourceUrns }];
  }

  const availableStart = new Date(
    Math.min(...periods.map((p) => p.startPeriod.getTime())),
  );
  const availableEnd = new Date(
    Math.max(...periods.map((p) => p.endPeriod.getTime())),
  );

  const currentStart = filter.timeRange.startPeriod as Date | undefined;
  const currentEnd = filter.timeRange.endPeriod as Date | undefined;

  return [
    {
      ...filter,
      sourceDatasetUrns: enabledSourceUrns,
      timeRange: {
        startPeriod: currentStart
          ? new Date(Math.max(currentStart.getTime(), availableStart.getTime()))
          : availableStart,
        endPeriod: currentEnd
          ? new Date(Math.min(currentEnd.getTime(), availableEnd.getTime()))
          : availableEnd,
      },
    },
  ];
};

/**
 * Returns a display-safe copy of `filters` where SharedFilter values that
 * belong exclusively to disabled datasets are removed. A SharedFilter with
 * no remaining visible values is omitted entirely (facet hidden).
 * DatasetFilter entries are passed through unchanged.
 *
 * Does NOT mutate `filters`. Call this in a useMemo for display only.
 */
export const filterSharedValuesForEnabledDatasets = (
  filters: Filter[],
  disabledDatasetUrns: Set<string>,
  constraintsMap?: Map<string, DataConstraints[] | undefined>, // used by the Time Period path
): Filter[] => {
  if (disabledDatasetUrns.size === 0) return filters;

  return filters.flatMap((filter): Filter[] => {
    if (filter.filterType !== 'shared') return [filter];

    if (filter.isTimeDimension) {
      return filterTimeDimensionForEnabledDatasets(
        filter,
        disabledDatasetUrns,
        constraintsMap,
      );
    }

    const filteredValues = (filter.dimensionValues ?? []).filter((value) =>
      // datasetUrn absent (structurally incomplete source) → treat as enabled (not in disabled set)
      value.sourceValues?.some(
        (sv) => !disabledDatasetUrns.has(sv.datasetUrn ?? ''),
      ),
    );

    if (filteredValues.length === 0) return [];
    return [{ ...filter, dimensionValues: filteredValues }];
  });
};
