import { TimeRange } from '@epam/statgpt-shared-toolkit';
import { DataConstraints } from '../models/structural-metadata/constraints';
import {
  getMonthlyData,
  getPeriodDate,
  getQuartersData,
  getSemiAnnualData,
  getYears,
} from '../parsers';
import {
  getISOWeek,
  getLastWeekNumberOfYear,
  getWeekCode,
} from './weekly-periods.utils';

export const getYearPeriod = (
  year: string | number,
  startPeriod: string,
  endPeriod: string,
): {
  start: Date;
  end: Date;
} => {
  const startPeriodDate = getPeriodDate(startPeriod, true) as Date;
  const endPeriodDate = getPeriodDate(endPeriod) as Date;
  const startYearDate = getPeriodDate(year, true) as Date;
  const endYearDate = getPeriodDate(year) as Date;
  const start =
    startPeriodDate.getTime() > startYearDate.getTime()
      ? startPeriodDate
      : startYearDate;
  const end =
    endPeriodDate.getTime() < endYearDate.getTime()
      ? endPeriodDate
      : endYearDate;

  return {
    start,
    end,
  };
};

export const getWeeksColumns = (
  year: string | number,
  startPeriod: string,
  endPeriod: string,
  weekSymbol = 'W',
): string[] => {
  const yearNum = +year;
  const { start, end } = getYearPeriod(year, startPeriod, endPeriod);

  if (start.getTime() > end.getTime()) {
    return [];
  }

  const startWeek = getISOWeek(start, weekSymbol);
  const startWeekNumber =
    startWeek.weekYear === yearNum
      ? startWeek.weekNumber
      : startWeek.weekYear < yearNum
        ? 1
        : getLastWeekNumberOfYear(yearNum, weekSymbol);
  const endWeek = getISOWeek(end, weekSymbol);
  const endWeekNumber =
    endWeek.weekYear === yearNum
      ? endWeek.weekNumber
      : endWeek.weekYear > yearNum
        ? getLastWeekNumberOfYear(yearNum, weekSymbol)
        : 1;

  const weeks = [];

  if (startWeekNumber < endWeekNumber) {
    for (let index = startWeekNumber; index <= endWeekNumber; index++) {
      weeks.push(getWeekCode(yearNum, index, weekSymbol));
    }
  }

  return weeks;
};

const getIsoDate = (date: Date): string => {
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() - newDate.getTimezoneOffset());

  return newDate.toISOString().slice(0, 10);
};

export const getDaysColumns = (
  year: string | number,
  startPeriod: string,
  endPeriod: string,
): string[] => {
  const { start, end } = getYearPeriod(year, startPeriod, endPeriod);

  if (start.getTime() > end.getTime()) {
    return [];
  }

  const days = [];
  const currentDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (currentDay.getTime() < endDay.getTime()) {
    const isoDate = getIsoDate(currentDay);
    days.push(isoDate);
    currentDay.setDate(currentDay.getDate() + 1);
  }

  return days;
};

export interface ExistingPeriods {
  isDailyExist: boolean;
  isWeeklyExist: boolean;
  isMonthlyExist: boolean;
  isQuarterlyExist: boolean;
  isSemiAnnualExist: boolean;
  isYearlyExist: boolean;
}

export const getPeriods = (
  arr: { memberValue: string }[],
): ExistingPeriods => ({
  isDailyExist: !!arr?.some(({ memberValue }) => memberValue === 'D'),
  isWeeklyExist: !!arr?.some(({ memberValue }) => memberValue === 'W'),
  isMonthlyExist: !!arr?.some(({ memberValue }) => memberValue === 'M'),
  isQuarterlyExist: !!arr?.some(({ memberValue }) => memberValue === 'Q'),
  isSemiAnnualExist: !!arr?.some(({ memberValue }) => memberValue === 'S'),
  isYearlyExist: !!arr?.some(
    ({ memberValue }) => memberValue === 'A' || memberValue === 'Y',
  ),
});

const getStartAndEnd = (
  years: number[],
  startPeriod: Date,
  endPeriod: Date,
  index: number,
): { startMonth?: number; endMonth?: number } => {
  const startMonth =
    index === 0
      ? (getPeriodDate(startPeriod.toString(), true)?.getMonth() as number) + 1
      : undefined;
  const endMonth =
    index === years.length - 1
      ? (getPeriodDate(endPeriod.toString())?.getMonth() as number) + 1 || 1
      : undefined;

  return { startMonth, endMonth };
};

export const FREQUENCY_DIM_ID = ['FREQUENCY', 'FREQ'];

export const getAdditionalColumns = (
  constraints: DataConstraints[],
  selectedTimePeriod: TimeRange,
): string[] => {
  const frequencyFacetValue =
    constraints?.[0]?.cubeRegions?.[0]?.memberSelection?.find((dim) =>
      FREQUENCY_DIM_ID.includes(dim.componentId),
    )?.selectionValues;
  const periods = getPeriods(frequencyFacetValue || []);

  const startPeriod = selectedTimePeriod?.startPeriod?.getTime() || 1;

  const endPeriod = selectedTimePeriod?.endPeriod?.getTime() || 1;

  const years = getYears(endPeriod, startPeriod);

  const columns: string[] = [];
  years.forEach((year, index) => {
    const additionalColumn: string[] = [];

    const { startMonth, endMonth } = getStartAndEnd(
      years,
      new Date(startPeriod),
      new Date(endPeriod),
      index,
    );
    const {
      isDailyExist,
      isWeeklyExist,
      isMonthlyExist,
      isQuarterlyExist,
      isSemiAnnualExist,
      isYearlyExist,
    } = periods;

    if (isYearlyExist) {
      additionalColumn.push(year.toString());
    }

    if (isSemiAnnualExist) {
      additionalColumn.push(...getSemiAnnualData(year, startMonth, endMonth));
    }

    if (isQuarterlyExist) {
      additionalColumn.push(
        ...getQuartersData(year, startMonth, endMonth, false),
      );
    }

    if (isMonthlyExist) {
      additionalColumn.push(...getMonthlyData(year, startMonth, endMonth));
    }

    if (isWeeklyExist) {
      additionalColumn.push(
        ...getWeeksColumns(year, startPeriod.toString(), endPeriod.toString()),
      );
    }

    if (isDailyExist) {
      additionalColumn.push(
        ...getDaysColumns(year, startPeriod.toString(), endPeriod.toString()),
      );
    }

    columns.push(...additionalColumn);
  });
  return columns;
};
