import {
  getTimeQueryFilter,
  getTimeSeriesFilterKey,
} from '@statgpt/shared-toolkit/src/utils/query-filters';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { DownloadType } from '@statgpt/sdmx-toolkit/src/types/files';
import { getTimeDimension } from '@statgpt/sdmx-toolkit/src/utils/get-dimensions';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';

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
        : getTimeSeriesFilterKey(dimensions, dataQuery.filters);

    timeFilter = getTimeQueryFilter(dataQuery, getTimeDimension(dimensions));
  }

  return {
    filterKey,
    timeFilter,
  };
};
