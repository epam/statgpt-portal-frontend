import { Filter } from '@statgpt/conversation-view/src/models/filters';
import { getSelectedFilterValues } from '@statgpt/conversation-view/src/utils/filters';
import { GET_v3_FILTER_OR } from '@statgpt/sdmx-toolkit/src/constants/filter-operators';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';
import {
  Dimension,
  DimensionList,
} from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import {
  DataQuery,
  QueryFilter,
} from '@statgpt/shared-toolkit/src/models/data-query';
import { QueryFilterType } from '@statgpt/shared-toolkit/src/types/query-filter-type';
import {
  getQueryTimePeriodFilters,
  getTimeRangeFromAttachment,
  getTimeSeriesFilterKey,
} from '@statgpt/shared-toolkit/src/utils/query-filters';

export const getQueryTimeSeriesFilters = (filters: Filter[]): QueryFilter[] =>
  filters.map(
    (filter): QueryFilter => ({
      componentCode: filter.id || '',
      operator: QueryFilterType.IN,
      values:
        filter.dimensionValues?.map((v) => v.id).join(GET_v3_FILTER_OR) || '',
    }),
  );

export const getUpdatedQueryTimeSeriesFilters = (
  queryFilters: QueryFilter[],
): QueryFilter[] => {
  return queryFilters?.map((queryFilter) => ({
    ...queryFilter,
    values: queryFilter.values?.split(',')?.join(GET_v3_FILTER_OR),
  }));
};

export const getTimeQueryFilterFromAttachment = (
  dataQuery: DataQuery,
  dimensions?: DimensionList,
): string | null => {
  const timeDimension = dimensions?.timeDimensions?.[0];
  const timeRange =
    getTimeRangeFromAttachment(dataQuery, timeDimension as Dimension) || null;
  const timeFilter = timeRange
    ? (getQueryTimePeriodFilters(timeRange, timeDimension?.id) as string)
    : null;
  return timeFilter;
};

export const getQueryFilters = (
  filters: Filter[],
  dimensions?: Dimension[],
): DatasetQueryFilters => {
  const selectedFilterValues = getSelectedFilterValues(filters);
  const timePeriodFilter = selectedFilterValues.find(
    (filter) => filter?.isTimeDimension && filter?.timeRange,
  );
  return {
    filterKey: getTimeSeriesFilterKey(
      dimensions || [],
      getQueryTimeSeriesFilters(selectedFilterValues),
    ),
    timeFilter: getQueryTimePeriodFilters(
      timePeriodFilter?.timeRange,
      timePeriodFilter?.id,
    ),
  };
};
