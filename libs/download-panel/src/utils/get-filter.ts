import {
  DatasetQueryFilters,
  Dimension,
  DownloadType,
  getTimeDimension,
  getTimeQueryFilter,
  getTimeSeriesFilterKey,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

export const getDownloadFilters = (
  type: DownloadType | null,
  dataQuery?: DataQuery,
  dimensions?: Dimension[],
  filters?: DatasetQueryFilters,
): DatasetQueryFilters => {
  if (filters?.filterKey && type === DownloadType.DATA_IN_TABLE) {
    return filters;
  }

  let filterKey: string | null = null;
  let timeFilter: string | null = null;

  if (dataQuery && dimensions && type === DownloadType.DATA_IN_TABLE) {
    filterKey =
      dimensions == null
        ? null
        : getTimeSeriesFilterKey(dimensions, dataQuery.filters ?? []);

    timeFilter = getTimeQueryFilter(dataQuery, getTimeDimension(dimensions));
  }

  return {
    filterKey,
    timeFilter,
  };
};

export const hasSelectedFilters = (splittedKey?: string[]) =>
  splittedKey?.length && splittedKey?.find((el) => el !== '*');
