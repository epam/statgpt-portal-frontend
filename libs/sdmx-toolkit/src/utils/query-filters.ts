import { GET_v3_FILTER_OR } from '../constants/filter-operators';
import {
  Dimension,
  DimensionType,
} from '../models/structural-metadata/data-structure';
import { SeriesFilterOperator } from '../types/logical-operator-type';
import {
  DataQuery,
  QueryFilter,
  TimeRange,
  getTimePeriod,
} from '@epam/statgpt-shared-toolkit';
import { format } from 'date-fns';
import {
  AND_QUERY_OPERATOR,
  QUERY_PARAMETER_FILTER_EQUAL,
  QUERY_PARAMETER_FILTER_VALUE_SEPARATOR,
} from '../constants/query-parameters';

export const getTimeSeriesFilterKey = (
  dimensions: Dimension[],
  filters: QueryFilter[],
): string => {
  const timeSeriesKeyValues = [];

  for (const dimension of dimensions) {
    if (dimension.type !== DimensionType.DIMENSION) {
      continue;
    }

    const filter = filters.find((f) => f.componentCode === dimension.id);

    if (filter != null && filter.values?.length > 0) {
      timeSeriesKeyValues.push(filter.values?.join(GET_v3_FILTER_OR));
    } else {
      timeSeriesKeyValues.push('*');
    }
  }

  return timeSeriesKeyValues.join('.');
};

export const getQueryTimePeriodFilters = (
  timeRange?: TimeRange | null,
  timePeriodId?: string,
): string | null => {
  if (!timeRange || (!timeRange.startPeriod && !timeRange.endPeriod)) {
    return null;
  }

  const filterValues = [];
  const { startPeriod, endPeriod } = timeRange;
  if (startPeriod) {
    filterValues.push(
      `${SeriesFilterOperator.GREATER_OR_EQUAL}${QUERY_PARAMETER_FILTER_VALUE_SEPARATOR}${formatLocalDate(startPeriod)}`,
    );
  }
  if (endPeriod) {
    filterValues.push(
      `${SeriesFilterOperator.LESS_OR_EQUAL}${QUERY_PARAMETER_FILTER_VALUE_SEPARATOR}${formatLocalDate(endPeriod)}`,
    );
  }

  if (filterValues.length === 0) {
    return null;
  }

  const id = timePeriodId;

  return filterValues
    .map(
      (v) =>
        `${encodeURIComponent(`c[${id}]`)}${QUERY_PARAMETER_FILTER_EQUAL}${encodeURIComponent(v)}`,
    )
    .join(AND_QUERY_OPERATOR);
};

const formatLocalDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getTimeQueryFilter = (
  dataQuery: DataQuery,
  timeDimension: Dimension,
): string | null => {
  const timeRange =
    getTimeRangeFromAttachment(dataQuery, timeDimension) || null;
  return timeRange
    ? (getQueryTimePeriodFilters(timeRange, timeDimension?.id) as string)
    : null;
};

export const getTimeRangeFromAttachment = (
  attachmentData: DataQuery,
  timeDimension: Dimension,
): TimeRange | null => {
  const timeDimensionId = timeDimension.id;
  const filterFromAttachment = attachmentData?.filters?.find(
    (filter) => filter.componentCode === timeDimensionId,
  );
  if (!filterFromAttachment || !filterFromAttachment.values) {
    return null;
  }
  const periods: string[] = filterFromAttachment.values?.filter((p) => !!p);

  if (!periods.length) {
    return null;
  }

  const operator = filterFromAttachment.operator as string;

  if (
    operator === SeriesFilterOperator.LESS_OR_EQUAL ||
    operator === SeriesFilterOperator.LESS
  ) {
    const endPeriod = getTimePeriod(periods[0]);
    return { startPeriod: null, endPeriod };
  }

  if (
    operator === SeriesFilterOperator.GREATER_OR_EQUAL ||
    operator === SeriesFilterOperator.GREATER
  ) {
    const startPeriod = getTimePeriod(periods[0]);
    return { startPeriod, endPeriod: null };
  }

  const startPeriod = getTimePeriod(periods[0]);
  const endPeriod = getTimePeriod(periods[1]);
  return { startPeriod, endPeriod };
};
