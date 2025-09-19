import { GET_v3_FILTER_OR } from '../constants/filter-operators';
import {
  Dimension,
  DimensionType,
} from '../models/structural-metadata/data-structure';
import { SeriesFilterOperator } from '../types/logical-operator-type';
import {
  DataQuery,
  QueryFilter,
} from '@statgpt/shared-toolkit/src/models/data-query';
import { TimeRange } from '@statgpt/shared-toolkit/src/models/time-range';
import { getTimePeriod } from '@statgpt/shared-toolkit/src/utils/get-time-period';

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
      `${SeriesFilterOperator.GREATER_OR_EQUAL}:${startPeriod.toISOString().split('T')[0]}`,
    );
  }
  if (endPeriod) {
    filterValues.push(
      `${SeriesFilterOperator.LESS_OR_EQUAL}:${endPeriod.toISOString().split('T')[0]}`,
    );
  }

  if (filterValues.length === 0) {
    return null;
  }

  const value = filterValues.join(GET_v3_FILTER_OR);

  const id = encodeURIComponent(`[${timePeriodId}]`);

  return `c${id}=${value}`;
};

export const getTimeQueryFilter = (
  dataQuery: DataQuery,
  timeDimension: Dimension,
): string | null => {
  const timeRange =
    getTimeRangeFromAttachment(dataQuery, timeDimension) || null;
  const timeFilter = timeRange
    ? (getQueryTimePeriodFilters(timeRange, timeDimension?.id) as string)
    : null;
  return timeFilter;
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
  const startPeriod = getTimePeriod(periods[0]);
  const endPeriod = getTimePeriod(periods[1]);
  return { startPeriod, endPeriod };
};
