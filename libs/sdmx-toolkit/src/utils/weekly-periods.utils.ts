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
