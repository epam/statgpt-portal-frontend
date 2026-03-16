import { isValid, parse, parseISO } from 'date-fns';

export const getTimePeriod = (timePeriod: string): Date | null => {
  if (!timePeriod.includes('T')) {
    for (const format of DATE_FORMATS) {
      const localDate = parse(timePeriod, format, new Date());
      if (isValid(localDate)) {
        return localDate;
      }
    }

    return null;
  }

  const parsedDate = parseISO(timePeriod);

  return isValid(parsedDate) ? parsedDate : null;
};

const DATE_FORMATS = ['yyyy-MM-dd', 'MM-dd-yyyy'] as const;
