import {
  getParsedEndPeriodDate,
  getParsedStartPeriodDate,
} from '@statgpt/sdmx-toolkit/src/parsers/time-period-parser/time-period';

const YEAR_BOUNDARY_VALUE = 1;

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
  const startDate = getPeriodDate(start, true);
  const endDate = getPeriodDate(end);

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
): Date => {
  const date = getPeriodDateByStr(period, isStart);
  if (!date) {
    return new Date();
  }
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

  // year - '2001' or '2002'
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
