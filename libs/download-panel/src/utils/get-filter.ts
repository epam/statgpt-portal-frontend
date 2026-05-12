import {
  DatasetQueryFilters,
  Dimension,
  DownloadType,
  GET_v3_FILTER_OR,
  getTimeDimension,
  getTimeQueryFilter,
  getTimeSeriesFilterKey,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

const getFiltersFromMetadata = (
  dataQuery: DataQuery,
): DatasetQueryFilters | null => {
  const keyDimIds = dataQuery.metadata?.keyDimensionIdsInDsdOrder;
  const timePeriodDimension = dataQuery.metadata?.timePeriodDimension;
  if (!keyDimIds?.length) return null;

  const filterKey = keyDimIds
    .map((dimId) => {
      const filter = dataQuery.filters?.find((f) => f.componentCode === dimId);
      return filter?.values?.length
        ? filter.values.join(GET_v3_FILTER_OR)
        : '*';
    })
    .join('.');

  const timeFilter = timePeriodDimension
    ? getTimeQueryFilter(dataQuery, { id: timePeriodDimension } as Dimension)
    : null;

  return { filterKey, timeFilter };
};

export const getDownloadFilters = (
  type: DownloadType | null,
  dataQuery?: DataQuery,
  dimensions?: Dimension[],
  filters?: DatasetQueryFilters,
): DatasetQueryFilters => {
  if (dataQuery && type === DownloadType.DATA_IN_TABLE) {
    const fromMetadata = getFiltersFromMetadata(dataQuery);
    if (fromMetadata) {
      return fromMetadata;
    }
  }

  if (filters?.filterKey && type === DownloadType.DATA_IN_TABLE) {
    return filters;
  }

  let filterKey: string | null = null;
  let timeFilter: string | null = null;

  if (dataQuery && dimensions && type === DownloadType.DATA_IN_TABLE) {
    filterKey = getTimeSeriesFilterKey(dimensions, dataQuery.filters ?? []);
    timeFilter = getTimeQueryFilter(dataQuery, getTimeDimension(dimensions));
  }

  return {
    filterKey,
    timeFilter,
  };
};

export const hasSelectedFilters = (splittedKey?: string[]) =>
  splittedKey?.length && splittedKey?.find((el) => el !== '*');
