import {
  isDaily,
  isMonthly,
  isQuarterly,
  isSemiAnnually,
  isWeekly,
  isYearly,
} from './define-period';
import {
  getParsedEndPeriodDate,
  getParsedStartPeriodDate,
} from './time-period';

export const sortPeriods = (a: string, b: string): number => {
  const res = getParsedPeriodMilliseconds(a) - getParsedPeriodMilliseconds(b);

  if (res === 0 && a !== b) {
    const aLevel = getPeriodLevelAsNumberToCompare(a);
    const bLevel = getPeriodLevelAsNumberToCompare(b);
    return aLevel - bLevel;
  }
  return res;
};

const getPeriodLevelAsNumberToCompare = (period: string): number => {
  if (isYearly(period)) {
    return 6;
  }
  if (isSemiAnnually(period)) {
    return 5;
  }
  if (isQuarterly(period)) {
    return 4;
  }
  if (isMonthly(period)) {
    return 3;
  }
  if (isWeekly(period)) {
    return 2;
  }
  if (isDaily(period)) {
    return 1;
  }
  return 0;
};

const getParsedPeriodMilliseconds = (date: string, start = false): number => {
  const dt = start
    ? getParsedStartPeriodDate(date)
    : getParsedEndPeriodDate(date);
  return dt?.getTime() || 0;
};
