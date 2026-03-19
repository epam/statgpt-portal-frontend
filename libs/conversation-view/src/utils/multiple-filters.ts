import {
  DataConstraints,
  findCodelistByDimension,
  generateShortUrn,
  getAvailableCodesFromConstrains,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { Filter, FilterValue, FilterValueSource } from '../models/filters';
import { getDatasetFilters, getFiltersPreselectedByDataQuery } from './filters';
import { DataQuery, Locale } from '@epam/statgpt-shared-toolkit';
import { StructureDataMaps } from '../models/structure-data';
import { getFilledFilters } from './get-filled-filters';

type SharedFilterConfig = {
  id: string;
  order: number;
  key: string;
  getMergedValueKey: (value: FilterValue, datasetUrn?: string) => string;
};

export const COMMON_COUNTRY_FILTER_ID = 'COUNTRY';

const buildSharedFilterKey = (filterId: string) => `shared:${filterId}`;

const buildMergedValueNameKey = (name: string) => `name:${name}`;

const buildMergedValueDatasetKey = (datasetUrn: string, valueId: string) =>
  `dataset:${datasetUrn}:id:${valueId}`;

const SHARED_FILTERS_CONFIG: SharedFilterConfig[] = [
  {
    id: COMMON_COUNTRY_FILTER_ID,
    order: 0,
    key: buildSharedFilterKey(COMMON_COUNTRY_FILTER_ID),
    getMergedValueKey: (value, datasetUrn) => {
      const normalizedName = value?.name?.trim()?.toLocaleLowerCase();

      return normalizedName
        ? buildMergedValueNameKey(normalizedName)
        : buildMergedValueDatasetKey(datasetUrn || '', value.id);
    },
  },
];

const SHARED_FILTERS_CONFIG_MAP = new Map(
  SHARED_FILTERS_CONFIG.map((config) => [config.id, config]),
);

const getSharedFilterConfig = (filterId?: string) =>
  filterId ? SHARED_FILTERS_CONFIG_MAP.get(filterId) : void 0;

const isSharedFilterId = (filterId?: string) =>
  !!getSharedFilterConfig(filterId);

const isSharedFilter = (filter?: Filter) =>
  !!filter?.isCommonFilter && isSharedFilterId(filter?.id);

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

const sortSharedFiltersFirst = (filters: Filter[]): Filter[] => {
  return [...filters].sort((left, right) => {
    const leftOrder = left?.isCommonFilter
      ? (getSharedFilterConfig(left.id)?.order ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
    const rightOrder = right?.isCommonFilter
      ? (getSharedFilterConfig(right.id)?.order ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;

    return leftOrder - rightOrder;
  });
};

const mergeSharedFilters = (filters: Filter[]): Filter[] => {
  const groupedFilters = new Map<string, Filter[]>();
  const otherFilters: Filter[] = [];

  filters.forEach((filter) => {
    if (
      isSharedFilterId(filter?.id) &&
      filter?.datasetUrn &&
      !filter?.isCommonFilter
    ) {
      const group = groupedFilters.get(filter.id as string) || [];
      groupedFilters.set(filter.id as string, [...group, filter]);
      return;
    }

    otherFilters.push(filter);
  });

  const sharedFilters = Array.from(groupedFilters.entries()).flatMap(
    ([filterId, grouped]) => {
      const config = getSharedFilterConfig(filterId);

      if (!config || !grouped.length) {
        return [];
      }

      const sharedFilter: Filter = {
        ...grouped[0],
        key: config.key,
        datasetUrn: void 0,
        isCommonFilter: true,
        dimensionValues: mergeSharedFilterValues(grouped, config),
      };

      return sharedFilter;
    },
  );

  return sortSharedFiltersFirst([...sharedFilters, ...otherFilters]);
};

const expandSharedFilter = (filter: Filter): Filter[] => {
  if (!isSharedFilter(filter)) {
    return [filter];
  }

  const datasetFiltersMap = new Map<string, Filter>();

  filter.dimensionValues?.forEach((value) => {
    value.sourceValues?.forEach((sourceValue) => {
      const datasetUrn = sourceValue.datasetUrn || '';
      const existingFilter = datasetFiltersMap.get(datasetUrn);
      const mappedValue: FilterValue = {
        id: sourceValue.id,
        name: sourceValue.name,
        parent: sourceValue.parent,
        isSelectedValue: value.isSelectedValue,
      };

      if (existingFilter) {
        existingFilter.dimensionValues = [
          ...(existingFilter.dimensionValues || []),
          mappedValue,
        ];
        return;
      }

      datasetFiltersMap.set(datasetUrn, {
        ...filter,
        key: `${datasetUrn}:${filter.id}`,
        datasetUrn,
        isCommonFilter: false,
        dimensionValues: [mappedValue],
      });
    });
  });

  return Array.from(datasetFiltersMap.values());
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
): Filter[] => {
  return mergeSharedFilters(
    dataQueries?.flatMap((dataQuery) => {
      const urn = dataQuery?.urn;
      const filters = filtersMap?.get(urn) || [];
      const constraints = constraintsMap?.get(urn) || [];
      return getFiltersPreselectedByDataQuery(filters, dataQuery, constraints);
    }) || [],
  );
};

export const buildFiltersMap = (filters: Filter[]): Map<string, Filter[]> => {
  return filters
    ?.flatMap((filter) => expandSharedFilter(filter))
    ?.reduce((filterMap, filter) => {
      const urn = filter?.datasetUrn || '';
      if (!filterMap.has(urn)) {
        filterMap.set(urn, []);
      }
      filterMap?.get(urn)?.push(filter);

      return filterMap;
    }, new Map<string, Filter[]>());
};

export const getFiltersByConstraints = (
  filtersMap: Map<string, Filter[]>,
  structureDataMaps?: StructureDataMaps,
  locale = Locale.EN,
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

  return mergeSharedFilters(updatedFilters);
};

export const getFiltersForDataset = (
  filters: Filter[],
  datasetUrn?: string,
): Filter[] => {
  if (!datasetUrn) {
    return filters.filter((filter) => !filter.isCommonFilter);
  }

  return buildFiltersMap(filters).get(datasetUrn) || [];
};

export const getDatasetNameFromFilters = (
  filter: Filter,
  structuresMap?: Map<string, StructuralData | undefined>,
): string | undefined => {
  if (filter?.isCommonFilter) {
    return void 0;
  }

  const dataset = filter?.datasetUrn
    ? structuresMap?.get(filter.datasetUrn)?.dataflows?.[0]
    : void 0;

  return dataset
    ? generateShortUrn(dataset?.name, '', dataset?.agencyID)
    : void 0;
};
