import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { CalendarResolution } from '@statgpt/shared-toolkit/src/types/calendar';
import {
  TimeRange,
  TimeRangeOptions,
} from '@statgpt/shared-toolkit/src/models/time-range';
import {
  correctTimeZone,
  getPickerOptions,
  getRangedTimePeriod,
} from '@statgpt/conversation-view/src/utils/attachments/time-period';
import { Calendar } from '@statgpt/ui-components/src/components/Calendar/Calendar';
import { Radio } from '@statgpt/ui-components/src/components/Radio/Radio';
import { CUSTOM_PERIOD } from '@statgpt/shared-toolkit/src/constants/calendar';
import { Locale } from '@statgpt/shared-toolkit/src/types/locale';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

interface Props {
  initialTimeRange: TimeRange;
  calendarResolution: CalendarResolution;
  timeRange: TimeRange | null;
  timeRangeOptions: TimeRangeOptions[];
  calendarStartFromMonday?: boolean;
  locale?: string;
  radioIcon?: ReactNode;
  onValueChange: (value: TimeRange | null) => void;
  calendarIcon?: ReactNode;
  dateFormat?: string;
  titles?: ConversationViewTitles;
}

const TimePeriodFacet: FC<Props> = ({
  initialTimeRange,
  calendarResolution,
  timeRange,
  timeRangeOptions,
  calendarStartFromMonday = true,
  locale = Locale.EN,
  radioIcon,
  onValueChange,
  calendarIcon,
  dateFormat,
  titles,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange | null>(
    timeRange,
  );
  const [selectedTimeOption, setSelectedTimeOption] = useState(
    !timeRange ||
      (timeRange?.startPeriod?.getTime() ===
        initialTimeRange?.startPeriod?.getTime() &&
        timeRange?.endPeriod?.getTime() ===
          initialTimeRange?.endPeriod?.getTime())
      ? 0
      : CUSTOM_PERIOD,
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
    onValueChange(selectedTimeRange);
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
          : null,
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
          : null,
      );
    }
  };

  if (initialTimeRange == null) {
    return null;
  }

  const startPickerOptions = getPickerOptions(
    initialTimeRange.startPeriod as Date,
    selectedTimeRange?.endPeriod as Date,
    calendarResolution,
    locale,
    calendarStartFromMonday,
    dateFormat,
  );
  const endPickerOptions = getPickerOptions(
    selectedTimeRange?.startPeriod as Date,
    initialTimeRange.endPeriod as Date,
    calendarResolution,
    locale,
    calendarStartFromMonday,
    dateFormat,
  );

  return (
    <div className="mt-3">
      <div>
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
                    ? null
                    : getRangedTimePeriod(initialTimeRange, value),
                );
              }
            }}
            radioIcon={radioIcon}
          />
        ))}
      </div>

      <div>
        {selectedTimeOption === CUSTOM_PERIOD && (
          <div className="flex filters-time-period gap-4 mt-3 caption text-neutral-700">
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
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePeriodFacet;
