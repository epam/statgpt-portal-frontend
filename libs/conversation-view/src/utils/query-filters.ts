import { Filter } from '../models/filters';
import { getSelectedFilterValues } from './filters';
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
} from '@statgpt/sdmx-toolkit/src/utils/query-filters';

export const getQueryTimeSeriesFilters = (filters: Filter[]): QueryFilter[] =>
  filters.map(
    (filter): QueryFilter => ({
      componentCode: filter.id || '',
      operator: QueryFilterType.IN,
      values: filter.dimensionValues?.map((v) => v.id) || [],
    }),
  );

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

export const setDataQueryFilters = (filters: Filter[]): QueryFilter[] => {
  return filters
    ?.filter(
      (filter) =>
        filter.timeRange ||
        filter.dimensionValues?.some((value) => value.isSelectedValue),
    )
    .map((filter) => {
      if (filter?.isTimeDimension) {
        return {
          componentCode: filter?.id as string,
          operator: QueryFilterType.BETWEEN,
          values: [
            formatDate(filter?.timeRange?.startPeriod || undefined) || '',
            formatDate(filter?.timeRange?.endPeriod || undefined) || '',
          ],
        };
      }

      return {
        componentCode: filter?.id as string,
        operator: QueryFilterType.IN,
        values:
          filter?.dimensionValues
            ?.filter((value) => value.isSelectedValue)
            ?.map((value) => value.id) || [],
      };
    });
};

const formatDate = (date?: Date): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};
