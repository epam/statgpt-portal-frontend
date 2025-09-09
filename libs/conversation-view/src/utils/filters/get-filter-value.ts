import { Filter } from '@statgpt/conversation-view/src/models/filters';
import { getDateString } from '@statgpt/conversation-view/src/utils/attachments/time-period';

export const getFilterValues = (filter: Filter, locale?: string): string[] => {
  if (filter?.isTimeDimension && filter?.timeRange) {
    return [
      `${getDateString(filter?.timeRange?.startPeriod, locale)} - ${getDateString(filter?.timeRange?.endPeriod, locale)}`,
    ];
  }
  return (
    filter?.dimensionValues?.map((value) => value?.name || value?.id) || []
  );
};
