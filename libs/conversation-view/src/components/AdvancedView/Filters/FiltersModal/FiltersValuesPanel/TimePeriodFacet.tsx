'use client';
import {
  DataConstraints,
  getAnnotationPeriod,
} from '@epam/statgpt-sdmx-toolkit';
import {
  CalendarResolution,
  CUSTOM_PERIOD,
  Locale,
  TimeRange,
  TimeRangeOptions,
} from '@epam/statgpt-shared-toolkit';
import { Calendar, Radio } from '@epam/statgpt-ui-components';
import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  correctTimeZone,
  getPickerOptions,
  getRangedTimePeriod,
} from '../../../../../utils/attachments/time-period';
import { ConversationViewTitles } from '../../../../../models/titles';

interface Props {
  calendarResolution: CalendarResolution;
  timeRange: TimeRange | null;
  timeRangeOptions: TimeRangeOptions[];
  calendarStartFromMonday?: boolean;
  locale?: string;
  radioIcon?: ReactNode;
  initialConstraints?: DataConstraints[];
  onValueChange: (
    value: TimeRange | null,
    selectedTimeOption: string | number,
  ) => void;
  calendarIcon?: ReactNode;
  dateFormat?: string;
  titles?: ConversationViewTitles;
  defaultTimeOption?: string | number;
}

const TimePeriodFacet: FC<Props> = ({
  calendarResolution,
  timeRange,
  timeRangeOptions,
  calendarStartFromMonday = true,
  locale = Locale.EN,
  radioIcon,
  initialConstraints,
  onValueChange,
  calendarIcon,
  dateFormat,
  titles,
  defaultTimeOption,
}) => {
  const initialTimeRange = getAnnotationPeriod(
    initialConstraints?.[0]?.annotations,
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange | null>(
    timeRange,
  );
  const timeOption =
    !timeRange ||
    (timeRange?.startPeriod?.getTime() ===
      initialTimeRange?.startPeriod?.getTime() &&
      timeRange?.endPeriod?.getTime() ===
        initialTimeRange?.endPeriod?.getTime())
      ? 0
      : CUSTOM_PERIOD;

  const [selectedTimeOption, setSelectedTimeOption] = useState(
    defaultTimeOption ?? timeOption,
  );

  const filteredPeriodsButtons = useMemo(() => {
    const { startPeriod, endPeriod } = initialTimeRange;
    const constraintsStartYear = startPeriod?.getFullYear() as number;
    const constraintsEndYear = endPeriod?.getFullYear() as number;
    const currentYear = new Date().getFullYear();

    return timeRangeOptions.filter(
      (btn) =>
        btn.value === CUSTOM_PERIOD ||
        btn.value === 0 ||
        (+btn.value >= 0 && constraintsEndYear - currentYear >= +btn.value) ||
        (+btn.value < 0 && constraintsStartYear - currentYear < +btn.value),
    );
  }, [initialTimeRange, timeRangeOptions]);

  useEffect(() => {
    onValueChange(selectedTimeRange, selectedTimeOption);
    //TODO: resolve excessive rerenders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeRange]);

  const pickStartDate = (date: Date) => {
    if (date) {
      correctTimeZone(date);
      setSelectedTimeRange((prev) =>
        prev
          ? {
              ...prev,
              startPeriod: date || null,
            }
          : {
              endPeriod: null,
              startPeriod: date || null,
            },
      );
    }
  };

  const pickEndDate = (date: Date) => {
    if (date) {
      correctTimeZone(date);
      setSelectedTimeRange((prev) =>
        prev
          ? {
              ...prev,
              endPeriod: date || null,
            }
          : {
              startPeriod: null,
              endPeriod: date || null,
            },
      );
    }
  };

  if (initialTimeRange == null) {
    return null;
  }

  const startPickerOptions = getPickerOptions(
    initialTimeRange.startPeriod as Date,
    (selectedTimeRange?.endPeriod as Date) ||
      (initialTimeRange.endPeriod as Date),
    calendarResolution,
    locale,
    calendarStartFromMonday,
    dateFormat,
  );
  const endPickerOptions = getPickerOptions(
    (selectedTimeRange?.startPeriod as Date) ||
      (initialTimeRange.startPeriod as Date),
    initialTimeRange.endPeriod as Date,
    calendarResolution,
    locale,
    calendarStartFromMonday,
    dateFormat,
  );

  return (
    <div className="mt-3 flex h-full min-w-0 flex-1 flex-col overflow-auto py-2 pr-3">
      <div className="w-full">
        {filteredPeriodsButtons.map((periodButton) => (
          <Radio
            id={periodButton.value.toString()}
            key={periodButton.value.toString()}
            checked={selectedTimeOption === periodButton.value}
            label={periodButton.title}
            onChange={() => {
              const { value } = periodButton;
              setSelectedTimeOption(value);
              if (value !== CUSTOM_PERIOD) {
                setSelectedTimeRange(
                  value === 0
                    ? initialTimeRange
                    : getRangedTimePeriod(initialTimeRange, value),
                );
              }
            }}
            radioIcon={radioIcon}
          />
        ))}
      </div>

      <div className="w-full">
        {selectedTimeOption === CUSTOM_PERIOD && (
          <div className="filters-time-period caption mt-3 flex gap-4 text-neutral-700">
            <Calendar
              onChange={pickStartDate}
              options={startPickerOptions}
              value={
                (selectedTimeRange?.startPeriod ||
                  initialTimeRange?.startPeriod) as Date
              }
              label={titles?.from || 'From'}
              id="time-options-start"
              icon={calendarIcon}
            />

            <Calendar
              onChange={pickEndDate}
              options={endPickerOptions}
              value={
                (selectedTimeRange?.endPeriod ||
                  initialTimeRange?.endPeriod) as Date
              }
              label={titles?.to || 'To'}
              id="time-options-end"
              icon={calendarIcon}
              isEndDate
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePeriodFacet;
