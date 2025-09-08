import {
  isYearly,
  isSemiAnnually,
  isQuarterly,
  isMonthly,
  isWeekly,
  isDaily,
  getYearlyRegExp,
  getSemiAnnuallyRegExp,
  getQuarterlyRegExp,
  getMonthlyRegExp,
  getWeeklyRegExp,
  getDailyRegExp,
} from '../define-period';

describe('define period utils', () => {
  it('should match yearly', () => {
    expect(isYearly('2024')).toBe(true);
    expect(isYearly('24')).toBe(false);
    expect(getYearlyRegExp('2024')).not.toBeNull();
    expect(getYearlyRegExp('24')).toBeNull();
  });

  it('should match semi-annually', () => {
    expect(isSemiAnnually('2024-S1')).toBe(true);
    expect(isSemiAnnually('2024-S2')).toBe(true);
    expect(isSemiAnnually('2024-S3')).toBe(false);
    expect(getSemiAnnuallyRegExp('2024-S1')).not.toBeNull();
    expect(getSemiAnnuallyRegExp('2024-S3')).toBeNull();
  });

  it('should match quarterly', () => {
    expect(isQuarterly('2024-Q1')).toBe(true);
    expect(isQuarterly('2024-Q4')).toBe(true);
    expect(isQuarterly('2024-Q5')).toBe(false);
    expect(getQuarterlyRegExp('2024-Q2')).not.toBeNull();
    expect(getQuarterlyRegExp('2024-Q5')).toBeNull();
  });

  it('should match monthly', () => {
    expect(isMonthly('2024-M01')).toBe(true);
    expect(isMonthly('2024-M12')).toBe(true);
    expect(isMonthly('2024-M13')).toBe(false);
    expect(getMonthlyRegExp('2024-M01')).not.toBeNull();
    expect(getMonthlyRegExp('2024-M13')).toBeNull();
  });

  it('should match weekly', () => {
    expect(isWeekly('2024-W01')).toBe(true);
    expect(isWeekly('2024-W52')).toBe(true);
    expect(isWeekly('2024-W60')).toBe(false);
    expect(getWeeklyRegExp('2024-W01')).not.toBeNull();
    expect(getWeeklyRegExp('2024-W60')).toBeNull();
  });

  it('should match daily', () => {
    expect(isDaily('2024-01-01')).toBe(true);
    expect(isDaily('2024-12-31')).toBe(true);
    expect(isDaily('2024-13-01')).toBe(false);
    expect(getDailyRegExp('2024-01-01')).not.toBeNull();
    expect(getDailyRegExp('2024-13-01')).toBeNull();
  });
});
