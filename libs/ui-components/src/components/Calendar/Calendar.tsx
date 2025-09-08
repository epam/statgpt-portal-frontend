import Flatpickr, { OptionsType } from 'react-flatpickr';
import { useEffect, useRef, FC, ReactNode } from 'react';
import { CalendarResolution } from '@statgpt/shared-toolkit/src/types/calendar';
import { IconCalendarEvent } from '@tabler/icons-react';

interface Props {
  onChange: (date: Date) => void;
  value: Date;
  options: OptionsType;
  label: string;
  calendarResolution?: CalendarResolution;
  id?: string;
  icon?: ReactNode;
}

export const Calendar: FC<Props> = ({
  label,
  onChange,
  value,
  options,
  calendarResolution = CalendarResolution.DAY,
  id,
  icon,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref?.current;

    if (container) {
      container.querySelector('input')?.setAttribute('aria-label', label);
    }
  }, [label]);

  const updatedOptions = {
    ...options,
    defaultDate:
      calendarResolution === CalendarResolution.MONTH
        ? new Date(value.getFullYear(), value.getMonth())
        : value,
  };

  const onReady = (_: any, __: any, fp: any) => {
    const customCalendarClass = `calendar__${calendarResolution === CalendarResolution.MONTH ? 'month' : 'day'}`;
    fp.calendarContainer.classList.add(customCalendarClass);
    fp.calendarContainer.classList.add(customCalendarClass);
    fp.calendarContainer.classList.add(customCalendarClass);
  };

  const onOpen = (selectedDates: Date[], __: any, fp: any) => {
    if (
      calendarResolution === CalendarResolution.MONTH &&
      selectedDates.length > 0
    ) {
      const minDate = options.minDate as Date;
      const maxDate = options.maxDate as Date;
      const currentYear = selectedDates[0].getFullYear();

      const calendarContainer = fp.calendarContainer as HTMLElement;
      const disabledClass = 'flatpickr-disabled';

      const monthElements = calendarContainer.querySelectorAll(
        '.flatpickr-monthSelect-month',
      );
      const nextYearElement = calendarContainer.querySelectorAll(
        '.flatpickr-next-month',
      )[0];
      const prevYearElement = calendarContainer.querySelectorAll(
        '.flatpickr-prev-month',
      )[0];

      if (currentYear === maxDate.getFullYear()) {
        nextYearElement.classList.add(disabledClass);
      }

      if (currentYear === minDate.getFullYear()) {
        prevYearElement.classList.add(disabledClass);
      }

      if (
        currentYear === minDate.getFullYear() ||
        currentYear === maxDate.getFullYear()
      ) {
        monthElements.forEach((month: Element) => {
          month.classList.remove(disabledClass);
          const value = new Date(month.getAttribute('aria-label') as string);
          const isStartDate =
            value.getFullYear() === minDate.getFullYear() &&
            value.getMonth() === minDate.getMonth();
          const isEndDate =
            value.getFullYear() === maxDate.getFullYear() &&
            value.getMonth() === maxDate.getMonth();

          if (isStartDate || isEndDate) {
            return;
          }

          if (value < minDate || value > maxDate) {
            month.classList.add(disabledClass);
          }
        });
      }
    }
  };

  return (
    <div className="relative calendar" ref={ref}>
      <div className="mb-1 calendar-title">{label}</div>
      <label
        htmlFor={id}
        className="absolute cursor-pointer right-[11px] top-[29px]"
      >
        {icon || <IconCalendarEvent />}
      </label>
      <Flatpickr
        defaultValue={(calendarResolution === CalendarResolution.MONTH
          ? new Date(value.getFullYear(), value.getMonth())
          : value
        )?.toDateString()}
        options={updatedOptions}
        onChange={(dates) => {
          onChange(dates[0]);
        }}
        onOpen={[onOpen]}
        onReady={[onReady]}
        id={id}
      />
    </div>
  );
};
