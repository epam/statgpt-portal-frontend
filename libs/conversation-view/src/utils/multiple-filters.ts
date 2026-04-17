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
  TimeRange,
} from '@epam/statgpt-shared-toolkit';
import { StructureDataMaps } from '../models/structure-data';
import { getFilledFilters } from './get-filled-filters';
import { getSeriesFilterDto } from './get-series-filters';
import { normalizeConstraintFilters } from './normalize-constraint-filters';
import { buildRequestCacheKey, getCachedRequestResult } from './request-cache';
import { getQueryFilters, setDataQueryFilters } from './query-filters';

type SharedFilterConfig = {
  id: string;
  subtype?: string;
  getMergedValueKey: (value: FilterValue, datasetUrn?: string) => string;
};

type ExtendedStructuralMetadata = {
  urn: string;
  data?: StructuralMetaData;
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

const isSharedFilterId = (filterId?: string) =>
  !!getSharedFilterConfig(filterId);

const isSharedFilter = (filter?: Filter): filter is SharedFilter =>
  filter?.filterType === 'shared' && isSharedFilterId(filter?.id);

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

const getNativeSharedFallbackValues = (
  selectedValues: FilterValue[],
): FilterValue[] =>
  Array.from(
    new Map(
      selectedValues.flatMap(
        (value) =>
          value.sourceValues?.map((sourceValue) => [
            sourceValue.id,
            {
              id: sourceValue.id,
              name: sourceValue.name || '',
              isSelectedValue: true as const,
            },
          ]) ?? [],
      ),
    ).values(),
  );

const applySharedFallbackToDatasets = (
  filter: SharedFilter,
  datasetFiltersMap: Map<string, Filter>,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): void => {
  const selectedValues =
    filter.dimensionValues?.filter((value) => value.isSelectedValue) || [];

  if (!selectedValues.length) {
    return;
  }

  const nativeFallbackValues = getNativeSharedFallbackValues(selectedValues);

  if (!nativeFallbackValues.length) {
    return;
  }

  (filter.sourceDatasetUrns || []).forEach((datasetUrn) => {
    const existingFilter = datasetFiltersMap.get(datasetUrn);
    const hasSelectedValue = existingFilter?.dimensionValues?.some(
      (value) => value.isSelectedValue,
    );

    if (!existingFilter || !hasSelectedValue) {
      datasetFiltersMap.set(
        datasetUrn,
        toDatasetFilter(
          filter,
          datasetUrn,
          nativeFallbackValues,
          datasetDimensionsMetadataMap,
        ),
      );
    }
  });
};

const expandSharedFilter = (
  filter: Filter,
  propagateSharedFiltersToAllDatasets = false,
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

  if (propagateSharedFiltersToAllDatasets) {
    applySharedFallbackToDatasets(
      filter,
      datasetFiltersMap,
      datasetDimensionsMetadataMap,
    );
  }

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
) => {
  return new Map(
    Array.from(structureDataMaps?.dimensionsMap?.entries() || []).map(
      ([datasetUrn, dimensions]) => {
        const filters =
          dimensions?.map((dimension) => {
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

export const getFilledDatasetFiltersMap = (
  structureDataMaps?: StructureDataMaps,
  locale?: string,
) => {
  const datasetFiltersMap = getDatasetFiltersMapFromMultipleQueries(
    structureDataMaps,
    locale,
  );
  const filledDimensionsMap = getFiltersWithValuesMap(
    structureDataMaps,
    locale,
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
  return mergeSharedFilters(
    dataQueries?.flatMap((dataQuery) => {
      const urn = dataQuery?.urn;
      const filters = filtersMap?.get(urn) || [];
      const constraints = constraintsMap?.get(urn) || [];
      return getFiltersPreselectedByDataQuery(filters, dataQuery, constraints);
    }) || [],
    datasetDimensionsMetadataMap,
  );
};

export const buildFiltersMap = (
  filters: Filter[],
  constraintsMap?: Map<string, DataConstraints[] | undefined>,
  applySharedFallback = false,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): Map<string, Filter[]> => {
  return filters
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
};

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

export const getConstraintsRequests = (
  dataQueries?: DataQuery[],
  filtersMap?: Map<string, Filter[]>,
  actions?: {
    getConstraints: (
      urn: string,
      filters?: SeriesFilterDto[],
    ) => Promise<StructuralMetaData>;
  },
): Promise<ExtendedStructuralMetadata>[] => {
  return (
    dataQueries?.map((dataQuery) => {
      const attachmentUrn = dataQuery?.urn ?? '';
      const constraintFilters = normalizeConstraintFilters(
        getSeriesFilterDto(filtersMap?.get(attachmentUrn) || []).filter(
          (filter) => filter.componentCode !== TIME_PERIOD,
        ),
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

export const getConstraintsMap = (
  constraintsData: ExtendedStructuralMetadata[],
): Map<string, DataConstraints[] | undefined> => {
  return new Map(
    constraintsData?.map(({ urn, data }) => {
      const constraint = data?.data?.dataConstraints;
      return [urn, constraint];
    }),
  );
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
