export const quarterPattern = /^[0-9][0-9][0-9][0-9]-Q[1-4]$/;
export const weeklyPattern =
  /^[0-9][0-9][0-9][0-9]-W(0[1-9]|[1-4][0-9]|5[0-3])$/;
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
