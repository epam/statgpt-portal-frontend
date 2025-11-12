import { TimeRange } from '@epam/statgpt-shared-toolkit';
import { DataConstraints } from '../models';
const YEAR_BOUNDARY_VALUE = 1;

export const quarterPattern = /^[0-9][0-9][0-9][0-9]-Q[1-4]$/;
export const weeklyPattern = /^[0-9][0-9][0-9][0-9]-W[0-9][0-9]?$/;
export const semiAnnuallyPattern = /^[0-9][0-9][0-9][0-9]-S[1-2]$/;
export const yearlyPattern = /^[0-9][0-9][0-9][0-9]$/;
export const dailyPattern = /^[0-9][0-9][0-9][0-9]-(0[1-9]|1[0-2])-[0-9][0-9]$/;
export const monthlyPattern = /^[0-9][0-9][0-9][0-9]-M(0[1-9]|(1[0-2]))$/;

export const getYearlyRegExp = (date: string): RegExpExecArray | null =>
  yearlyPattern.exec(date);
export const isYearly = (date: string): boolean =>
  Boolean(getYearlyRegExp(date));

export const getSemiAnnuallyRegExp = (date: string): RegExpExecArray | null =>
  semiAnnuallyPattern.exec(date);
export const isSemiAnnually = (date: string): boolean =>
  Boolean(getSemiAnnuallyRegExp(date));

export const getMonthlyRegExp = (date: string): RegExpExecArray | null =>
  monthlyPattern.exec(date);
export const isMonthly = (date: string): boolean =>
  Boolean(getMonthlyRegExp(date));

export const getQuarterlyRegExp = (date: string): RegExpExecArray | null =>
  quarterPattern.exec(date);
export const isQuarterly = (date: string): boolean =>
  Boolean(getQuarterlyRegExp(date));

export const getDailyRegExp = (date: string): RegExpExecArray | null =>
  dailyPattern.exec(date);
export const isDaily = (date: string): boolean => Boolean(getDailyRegExp(date));

export const getWeeklyRegExp = (date: string): RegExpExecArray | null =>
  weeklyPattern.exec(date);
export const isWeekly = (date: string): boolean =>
  Boolean(getWeeklyRegExp(date));

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

function getParsedStartPeriodDate(date: string): Date | undefined {
  if (isYearly(date)) {
    return getYearlyPeriodStartDate(date);
  }
  if (isSemiAnnually(date)) {
    return getSemiAnnuallyPeriodStartDate(date);
  }
  if (isQuarterly(date)) {
    return getQuarterlyPeriodStartDate(date);
  }
  if (isMonthly(date)) {
    return getMonthlyPeriodStartDate(date);
  }
  if (isWeekly(date)) {
    return getWeeklyPeriodStartDate(date);
  }
  return getDailyPeriodStartDate(date);
}

function getParsedEndPeriodDate(date: string): Date | undefined {
  if (isYearly(date)) {
    return getYearlyPeriodEndDate(date);
  }
  if (isSemiAnnually(date)) {
    return getSemiAnnuallyPeriodEndDate(date);
  }
  if (isQuarterly(date)) {
    return getQuarterlyPeriodEndDate(date);
  }
  if (isMonthly(date)) {
    return getMonthlyPeriodEndDate(date);
  }
  if (isWeekly(date)) {
    return getWeeklyPeriodEndDate(date);
  }
  return getDailyPeriodEndDate(date);
}

function getYearlyPeriodStartDate(period: string): Date {
  const yearly: RegExpExecArray | null = getYearlyRegExp(period);
  return new Date(Number(yearly?.[0]), 0, 1);
}

function getYearlyPeriodEndDate(period: string): Date {
  const yearly: RegExpExecArray | null = getYearlyRegExp(period);
  return new Date(Number(yearly?.[0]) + 1, 0, 1);
}

function getSemiAnnuallyPeriodStartDate(period: string): Date | undefined {
  const [year, sem] = period.split('-S');
  switch (+sem) {
    case 1:
      return new Date(+year, 0, 1);
    case 2:
      return new Date(+year, 6, 1);
  }
}

function getSemiAnnuallyPeriodEndDate(period: string): Date | undefined {
  const [year, sem] = period.split('-S');
  switch (+sem) {
    case 1:
      return new Date(+year, 6, 1);
    case 2:
      return new Date(+year + 1, 0, 1);
  }
}

function getQuarterlyPeriodStartDate(period: string): Date | undefined {
  const quarter = getQuarterlyRegExp(period) as RegExpExecArray;
  const [year, qtr] = quarter[0].split('-Q');
  switch (+qtr) {
    case 1:
      return new Date(+year, 0, 1);
    case 2:
      return new Date(+year, 3, 1);
    case 3:
      return new Date(+year, 6, 1);
    case 4:
      return new Date(+year, 9, 1);
  }
}

function getQuarterlyPeriodEndDate(period: string): Date | undefined {
  const quarter: RegExpExecArray = getQuarterlyRegExp(
    period,
  ) as RegExpExecArray;
  const [year, qtr] = quarter[0].split('-Q');
  switch (+qtr) {
    case 1:
      return new Date(+year, 3, 1);
    case 2:
      return new Date(+year, 6, 1);
    case 3:
      return new Date(+year, 9, 1);
    case 4:
      return new Date(+year + 1, 0, 1);
  }
}

function getMonthlyPeriodStartDate(period: string): Date {
  const monthly: RegExpExecArray = getMonthlyRegExp(period) as RegExpExecArray;
  const [year, month] = monthly[0].split('-M');
  return new Date(+year, +month - 1, 1);
}

function getMonthlyPeriodEndDate(period: string): Date {
  const monthly: RegExpExecArray | null = getMonthlyRegExp(
    period,
  ) as RegExpExecArray;
  const [year, month] = monthly[0].split('-M');
  return new Date(+year, +month, 1);
}

function getDailyPeriodStartDate(period: string): Date {
  return new Date(period);
}

function getDailyPeriodEndDate(period: string): Date {
  return new Date(period);
}

export const getQuartersData = (
  year: number,
  startMonth?: number,
  endMonth?: number,
  includeBorderValues = true,
  quarterSymbol = 'Q',
): string[] => {
  const quartersData: string[] = [];
  const startQuarter =
    startMonth && startMonth > 3
      ? getQuarter(startMonth, includeBorderValues)
      : 1;
  //because month border does not include
  const endQuarter = endMonth ? Math.floor((endMonth - 1) / 3) : 4;

  for (let i = startQuarter; i <= endQuarter; i++) {
    quartersData.push(`${year}-${quarterSymbol}${i}`);
  }

  return quartersData;
};

export const getSemiAnnualData = (
  year: number,
  startMonth?: number,
  endMonth?: number,
  semiAnnualSymbol = 'S',
): string[] => {
  const periods = [];
  if ((startMonth || 1) < 7 && (endMonth || 12) > 6) {
    periods.push(`${year}-${semiAnnualSymbol}1`);
  }
  if (endMonth == null) {
    periods.push(`${year}-${semiAnnualSymbol}2`);
  }
  return periods;
};

export const getQuarterByMonth = (month: number): number =>
  Math.ceil(month / 3);

const getMonth = (year: number, index: number, monthSymbol = 'M') => {
  return `${year}-${monthSymbol}${index.toString().padStart(2, '0')}`;
};

const getMonthsForWholeYear = (
  year: number,
  start: number,
  monthSymbol = 'M',
): string[] => {
  const periods = [];
  for (let i = start; i <= 12; i++)
    periods.push(getMonth(year, i, monthSymbol));
  return periods;
};
const getMonthsByRange = (
  year: number,
  start: number,
  end: number,
  monthSymbol = 'M',
): string[] => {
  const periods = [];
  for (let i = start; i < end; i++)
    periods.push(getMonth(year, i, monthSymbol));
  return periods;
};

export const getMonthlyData = (
  year: number,
  startMonth?: number,
  endMonth?: number,
  monthSymbol = 'M',
): string[] => {
  const start = startMonth || 1;
  const isBorderIncluded = endMonth == null;
  const end = endMonth || 12;

  if (isBorderIncluded) {
    return getMonthsForWholeYear(year, start, monthSymbol);
  } else {
    return getMonthsByRange(year, start, end, monthSymbol);
  }
};

export const getMonthlyDataByQuarter = (
  year: number,
  quarter: number,
  monthSymbol = 'M',
): string[] => {
  switch (quarter) {
    case 0:
      return [
        `${year}-${monthSymbol}01`,
        `${year}-${monthSymbol}02`,
        `${year}-${monthSymbol}03`,
      ];
    case 1:
      return [
        `${year}-${monthSymbol}04`,
        `${year}-${monthSymbol}05`,
        `${year}-${monthSymbol}06`,
      ];
    case 2:
      return [
        `${year}-${monthSymbol}07`,
        `${year}-${monthSymbol}08`,
        `${year}-${monthSymbol}09`,
      ];
    case 3:
      return [
        `${year}-${monthSymbol}10`,
        `${year}-${monthSymbol}11`,
        `${year}-${monthSymbol}12`,
      ];
    default:
      return [];
  }
};

export const getYears = (
  end: number | string,
  start: number | string,
): number[] => {
  const startDate = getPeriodDate(start, true) as Date;
  const endDate = getPeriodDate(end) as Date;

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const length =
    startDate.getTime() <= endDate.getTime()
      ? endYear + YEAR_BOUNDARY_VALUE - startYear
      : 0;
  const years = Array.from({ length }, (_, index) => startYear + index);

  return years;
};

export const getPeriodDate = (
  period: number | string,
  isStart = false,
): Date | undefined => {
  const date = getPeriodDateByStr(period, isStart) as Date;

  if (date.getTimezoneOffset() > 0) {
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  }

  return date;
};

const getPeriodDateByStr = (
  period: number | string,
  isStart = false,
): Date | undefined => {
  const periodMill = Number(period);

  if (period.toString().length !== 13) {
    return isStart
      ? getParsedStartPeriodDate(period as string)
      : getParsedEndPeriodDate(period as string);
  }

  if (isNaN(periodMill)) {
    return new Date(`${period}T00:00:00.000Z`);
  }

  return new Date(periodMill);
};

const getQuarter = (month: number, includeStart: boolean): number => {
  return includeStart
    ? Math.floor((month + 1) / 3)
    : Math.ceil((month + 1) / 3);
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

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const MS_IN_WEEK = 7 * MS_IN_DAY;

function getFirstTuesdayOfYear(year: number): Date {
  const iso1Jan = `${year}-01-01`;
  const date = new Date(iso1Jan);
  if (date.getDay() !== 4) {
    const shiftToNextThursday = (4 - date.getDay() + 7) % 7;
    const dayInMonth = 1 + shiftToNextThursday;
    date.setMonth(0, dayInMonth);
  }
  return date;
}

function getThursdayOfSameWeek(d: Date): Date {
  const date = new Date(d);
  // calculate day number starting monday as 0 (not sunday as by default)
  const dayNumber = (date.getDay() + 6) % 7;
  const shiftToThursdayOfCurrentWeek = -dayNumber + 3;
  date.setDate(date.getDate() + shiftToThursdayOfCurrentWeek);
  return new Date(date.valueOf());
}

export function getLastWeekNumberOfYear(
  year: number,
  weekSymbol = 'W',
): number {
  const iso31Dec = `${year}-12-31`;
  const week31Dec = getISOWeek(new Date(iso31Dec), weekSymbol);
  if (week31Dec.weekYear === year) {
    return week31Dec.weekNumber;
  }
  const iso24Dec = `${year}-12-24`;
  const week24Dec = getISOWeek(new Date(iso24Dec), weekSymbol);
  return week24Dec.weekNumber;
}

export function getWeekCode(
  year: number,
  week: number,
  weekSymbol = 'W',
): string {
  return `${year}-${weekSymbol}${week < 10 ? '0' + week : week}`;
}

export function getISOWeek(
  d: Date,
  weekSymbol = 'W',
): {
  code: string;
  weekYear: number;
  weekNumber: number;
} {
  const thursdayOfCurrentWeek = getThursdayOfSameWeek(d);
  const yearOfWeek = thursdayOfCurrentWeek.getFullYear();
  const firstThursdayOfYear = getFirstTuesdayOfYear(yearOfWeek);
  const weekNumber =
    1 +
    Math.ceil(
      (thursdayOfCurrentWeek.getTime() - firstThursdayOfYear.getTime()) /
        MS_IN_WEEK,
    );

  return {
    code: getWeekCode(yearOfWeek, weekNumber, weekSymbol),
    weekNumber: weekNumber,
    weekYear: yearOfWeek,
  };
}

export function getWeeklyPeriodStartDate(period: string): Date {
  const [year, weekNumber] = period.split('-W');
  const firstThursdayOfYear = getFirstTuesdayOfYear(+year);
  const mondayOfPeriodWeek =
    firstThursdayOfYear.getTime() +
    (+weekNumber - 1) * MS_IN_WEEK -
    3 * MS_IN_DAY;
  return new Date(mondayOfPeriodWeek);
}

export function getWeeklyPeriodEndDate(period: string): Date {
  const [year, weekNumber] = period.split('-W');
  const firstThursdayOfYear = getFirstTuesdayOfYear(+year);
  const sundayOfPeriodWeek =
    firstThursdayOfYear.getTime() +
    (+weekNumber - 1) * MS_IN_WEEK +
    3 * MS_IN_DAY;
  return new Date(sundayOfPeriodWeek);
}

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
