import {
  DatasetQueryFilters,
  Dimension,
  DimensionList,
  getQueryTimePeriodFilters,
  getTimeRangeFromAttachment,
  getTimeSeriesFilterKey,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  QueryFilter,
  QueryFilterType,
} from '@epam/statgpt-shared-toolkit';
import { Filter } from '../models/filters';
import { getSelectedFilterValues } from './filters';
import { getFiltersForDataset } from './multiple-filters';

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
  datasetUrn?: string,
): DatasetQueryFilters => {
  const selectedFilterValues = getSelectedFilterValues(
    getFiltersForDataset(filters, datasetUrn),
  );
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

export const setDataQueryFilters = (
  filters: Filter[],
  datasetUrn?: string,
): QueryFilter[] => {
  return getFiltersForDataset(filters, datasetUrn)
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
