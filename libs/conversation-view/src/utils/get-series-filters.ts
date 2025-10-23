import {
  GET_v3_FILTER_AND,
  SeriesFilterDto,
  SeriesFilterOperator,
} from '@epam/statgpt-sdmx-toolkit';
import { TimeRange } from '@epam/statgpt-shared-toolkit';
import { Filter } from '../models/filters';

export const getSeriesFilterDto = (filters: Filter[]): SeriesFilterDto[] => {
  let seriesFilters: SeriesFilterDto[] = [];
  filters
    .filter(
      (filter) =>
        filter.timeRange ||
        filter.dimensionValues?.some((value) => value.isSelectedValue),
    )
    .forEach((filter) => {
      const { id, dimensionValues } = filter;

      if (filter.isTimeDimension) {
        seriesFilters = [
          ...seriesFilters,
          ...getTimeSeriesFilterDto(filter.timeRange, id as string),
        ];
      } else
        seriesFilters.push({
          componentCode: id as string,
          operator: SeriesFilterOperator.EQUALS,
          value:
            dimensionValues
              ?.filter((value) => value.isSelectedValue)
              ?.map((value) => value.id)
              .join(GET_v3_FILTER_AND) || '',
        });
    });
  return seriesFilters;
};

export const getTimeSeriesFilterDto = (
  timeRange: TimeRange | null | undefined,
  id: string,
): SeriesFilterDto[] => {
  if (
    timeRange == null ||
    timeRange.startPeriod == null ||
    timeRange.endPeriod == null
  ) {
    return [];
  }

  return [
    {
      componentCode: id,
      operator: SeriesFilterOperator.GREATER_OR_EQUAL,
      value: getTimeFilter(new Date(timeRange.startPeriod as Date)),
    },
    {
      componentCode: id,
      operator: SeriesFilterOperator.LESS_OR_EQUAL,
      value: getTimeFilter(new Date(timeRange.endPeriod as Date), 1),
    },
  ];
};
export const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export const getTimeFilter = (date: Date, increment = 0): string => {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  let time = date.getTime();
  time += increment ? ONE_DAY_MS - 1 : 0;

  date = new Date(time);

  return time.toString();
};
