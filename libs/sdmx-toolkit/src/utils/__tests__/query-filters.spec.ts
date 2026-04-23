import { getQueryTimePeriodFilters } from '../query-filters';
import type { TimeRange } from '@epam/statgpt-shared-toolkit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const d = (year: number, month: number, day: number): Date =>
  new Date(year, month - 1, day);

// ---------------------------------------------------------------------------
// getQueryTimePeriodFilters
// ---------------------------------------------------------------------------

describe('getQueryTimePeriodFilters', () => {
  it('returns null when timeRange is null', () => {
    expect(getQueryTimePeriodFilters(null, 'TIME_PERIOD')).toBeNull();
  });

  it('returns null when timeRange is undefined', () => {
    expect(getQueryTimePeriodFilters(undefined, 'TIME_PERIOD')).toBeNull();
  });

  it('returns null when both periods are null', () => {
    expect(
      getQueryTimePeriodFilters({ startPeriod: null, endPeriod: null }, 'TIME_PERIOD'),
    ).toBeNull();
  });

  it('produces a ge: param for start period only', () => {
    const range: TimeRange = { startPeriod: d(2020, 1, 15), endPeriod: null };
    expect(decodeURIComponent(getQueryTimePeriodFilters(range, 'TIME_PERIOD')!)).toBe(
      'c[TIME_PERIOD]=ge:2020-01-15',
    );
  });

  it('produces a le: param for end period only', () => {
    const range: TimeRange = { startPeriod: null, endPeriod: d(2023, 12, 31) };
    expect(decodeURIComponent(getQueryTimePeriodFilters(range, 'TIME_PERIOD')!)).toBe(
      'c[TIME_PERIOD]=le:2023-12-31',
    );
  });

  it('combines ge: and le: with + into a single param for a full range', () => {
    const range: TimeRange = { startPeriod: d(2020, 1, 15), endPeriod: d(2023, 12, 31) };
    expect(decodeURIComponent(getQueryTimePeriodFilters(range, 'TIME_PERIOD')!)).toBe(
      'c[TIME_PERIOD]=ge:2020-01-15+le:2023-12-31',
    );
  });

  it('emits exactly one c[...] param for a full range (spec: once per component)', () => {
    const range: TimeRange = { startPeriod: d(2020, 1, 15), endPeriod: d(2023, 12, 31) };
    const result = getQueryTimePeriodFilters(range, 'TIME_PERIOD')!;
    expect(result.split('c%5B').length - 1).toBe(1);
  });

  it('uses the provided component id as the param key', () => {
    const range: TimeRange = { startPeriod: d(2020, 1, 1), endPeriod: null };
    expect(decodeURIComponent(getQueryTimePeriodFilters(range, 'OBS_TIME')!)).toBe(
      'c[OBS_TIME]=ge:2020-01-01',
    );
  });
});
