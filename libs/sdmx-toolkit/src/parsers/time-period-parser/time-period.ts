import {
  getMonthlyRegExp,
  getQuarterlyRegExp,
  getYearlyRegExp,
  isMonthly,
  isQuarterly,
  isSemiAnnually,
  isWeekly,
  isYearly,
} from '@statgpt/sdmx-toolkit/src/parsers/time-period-parser/define-period';
import {
  getWeeklyPeriodEndDate,
  getWeeklyPeriodStartDate,
} from '@statgpt/sdmx-toolkit/src/utils/weekly-periods.utils';

export function getParsedStartPeriodDate(date: string): Date | undefined {
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

export function getParsedEndPeriodDate(date: string): Date | undefined {
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

function getYearlyPeriodStartDate(period: string): Date | undefined {
  const yearly = getYearlyRegExp(period);
  if (!yearly) {
    return;
  }
  return new Date(Number(yearly[0]), 0, 1);
}

function getYearlyPeriodEndDate(period: string): Date | undefined {
  const yearly = getYearlyRegExp(period);
  if (!yearly) {
    return;
  }
  return new Date(Number(yearly[0]) + 1, 0, 1);
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
  const quarter = getQuarterlyRegExp(period);

  if (!quarter) {
    return;
  }
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
  const quarter = getQuarterlyRegExp(period);

  if (!quarter) {
    return;
  }
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

function getMonthlyPeriodStartDate(period: string): Date | undefined {
  const monthly = getMonthlyRegExp(period);
  if (!monthly) {
    return;
  }
  const [year, month] = monthly[0].split('-M');
  return new Date(+year, +month - 1, 1);
}

function getMonthlyPeriodEndDate(period: string): Date | undefined {
  const monthly = getMonthlyRegExp(period);
  if (!monthly) {
    return;
  }
  const [year, month] = monthly[0].split('-M');
  return new Date(+year, +month, 1);
}

const getDailyPeriodStartDate = (period: string): Date => {
  return new Date(`${period}T00:00:00`);
};

const getDailyPeriodEndDate = (period: string): Date => {
  const date = new Date(`${period}T23:59:00`);
  date.setMinutes(date.getMinutes() + 1);
  return date;
};
