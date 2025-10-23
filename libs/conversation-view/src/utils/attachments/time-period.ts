import {
  isMonthly,
  isQuarterly,
  SeriesFilterDto,
  SeriesFilterOperator,
  TIME_PERIOD,
} from '@epam/statgpt-sdmx-toolkit';
import {
  CalendarResolution,
  DataQuery,
  TimeRange,
} from '@epam/statgpt-shared-toolkit';
import FlatpickrLanguages from 'flatpickr/dist/l10n';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
import { OptionsType } from 'react-flatpickr';
import { ConversationViewTitles } from '../../models/titles';

export const getPickerOptions = (
  minDate: Date,
  maxDate: Date,
  calendarResolution: CalendarResolution,
  lang: string,
  startFromMonday = false,
  dateFormat?: string,
): OptionsType => {
  const localeSettings = {
    ...FlatpickrLanguages[lang as keyof typeof FlatpickrLanguages],
  };
  const MonthSelectPlugin = monthSelectPlugin;

  if (startFromMonday) {
    localeSettings.firstDayOfWeek = 1;
  }

  const baseConfig = {
    minDate:
      calendarResolution === CalendarResolution.MONTH
        ? new Date(minDate.getFullYear(), minDate.getMonth())
        : minDate,
    maxDate:
      calendarResolution === CalendarResolution.MONTH
        ? new Date(maxDate.getFullYear(), maxDate.getMonth())
        : maxDate,
    locale: localeSettings,
  };

  if (calendarResolution === CalendarResolution.MONTH) {
    return {
      ...baseConfig,
      dateFormat: 'M Y',
      plugins: [
        new (MonthSelectPlugin as any)({
          shorthand: true,
          dateFormat: 'M Y',
        }),
      ],
    };
  }

  return {
    ...baseConfig,
    monthSelectorType: 'static',
    dateFormat: dateFormat || 'd.m.Y',
  };
};

export const correctTimeZone = (date: Date): void => {
  if (date == null) {
    return;
  }

  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
};

export const dayTimeFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

export const monthTimeFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
};

export const getDateString = (date?: Date | null, locale?: string): string =>
  date?.toLocaleDateString(locale, dayTimeFormatOptions) || '';

export const getMergedTimeRange = (
  attachmentTimeRange: TimeRange,
  constraintsTimeRange: TimeRange,
): TimeRange => {
  const { startPeriod: attachmentStartPeriod, endPeriod: attachmentEndPeriod } =
    attachmentTimeRange;

  if (
    !constraintsTimeRange.startPeriod &&
    !constraintsTimeRange.endPeriod &&
    attachmentStartPeriod &&
    attachmentEndPeriod
  ) {
    return {
      startPeriod: new Date(attachmentStartPeriod?.getTime()),
      endPeriod: new Date(attachmentEndPeriod?.getTime()),
    };
  }

  const startPeriod = attachmentStartPeriod
    ? new Date(
        Math.max(
          attachmentStartPeriod.getTime(),
          (constraintsTimeRange.startPeriod as Date).getTime(),
        ),
      )
    : constraintsTimeRange.startPeriod;
  const endPeriod = attachmentEndPeriod
    ? new Date(
        Math.min(
          attachmentEndPeriod.getTime(),
          (constraintsTimeRange.endPeriod as Date).getTime(),
        ),
      )
    : constraintsTimeRange.endPeriod;

  return { startPeriod, endPeriod };
};

export const getRangedTimePeriod = (
  initialTimeRange: TimeRange,
  period: string | number,
): TimeRange => {
  const { endPeriod } = initialTimeRange;
  const currentYear = endPeriod?.getFullYear() || new Date().getFullYear();
  const year = currentYear + +period;
  const newEndPeriod = new Date(
    +period < 0 ? currentYear : year,
    endPeriod?.getMonth() || 0,
    endPeriod?.getDate() || 1,
  );
  const newStartPeriod = new Date(+period < 0 ? year : currentYear, 0, 1);

  const range = {
    startPeriod: new Date(
      Math.max(
        newStartPeriod.getTime(),
        initialTimeRange?.startPeriod?.getTime() || 0,
      ),
    ),
    endPeriod: newEndPeriod,
  };

  return range;
};

const getLocalizedTimeIndicatorMap = (
  titles?: ConversationViewTitles,
): Record<string, string | undefined> => {
  return {
    quarterly: titles?.quarterly || 'Q',
    monthly: titles?.monthly || 'M',
  };
};

export const localizeTimePeriod = (
  period: string,
  titles?: ConversationViewTitles,
): string => {
  const localizedTimeIndicatorMap = getLocalizedTimeIndicatorMap(titles);

  if (isQuarterly(period) && localizedTimeIndicatorMap?.quarterly) {
    return period?.replace(/Q/g, localizedTimeIndicatorMap?.quarterly);
  }

  if (isMonthly(period) && localizedTimeIndicatorMap?.monthly) {
    return period?.replace(/M/g, localizedTimeIndicatorMap?.monthly);
  }

  return period;
};

export const getFiltersDtoFromDataQuery = (
  dataQuery: DataQuery,
): SeriesFilterDto[] => {
  const filters: SeriesFilterDto[] = [];
  dataQuery?.filters?.forEach((filter) => {
    if (filter.componentCode !== TIME_PERIOD) {
      filters.push({
        componentCode: filter.componentCode,
        operator: SeriesFilterOperator.EQUALS,
        value: filter.values.join(','),
      });
    }
  });
  return filters;
};
