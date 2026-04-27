import { TimeRange, getTimePeriod } from '@epam/statgpt-shared-toolkit';
import {
  getMergedInitialConstraints,
  getTimeRangeFromDataQueries,
} from '../time-period';

const d = (iso: string) => new Date(iso);
const mockGetTimePeriod = getTimePeriod as jest.Mock;

const range = (start: string | null, end: string | null): TimeRange => ({
  startPeriod: start ? d(start) : null,
  endPeriod: end ? d(end) : null,
});

const START = new Date('2018-01-01');
const END = new Date('2023-12-31');

jest.mock('@epam/statgpt-shared-toolkit', () => ({
  getTimePeriod: jest.fn(),
}));

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  TIME_PERIOD: 'TIME_PERIOD',
  isMonthly: jest.fn(),
  isQuarterly: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeQuery = (values: string[]) => ({
  urn: 'urn:test',
  metadata: { countryDimension: 'REF_AREA', indicatorDimensions: [] },
  filters: [{ componentCode: 'TIME_PERIOD', operator: 'in' as const, values }],
});

const makeQueryWithoutTimePeriod = () => ({
  urn: 'urn:test',
  metadata: { countryDimension: 'REF_AREA', indicatorDimensions: [] },
  filters: [{ componentCode: 'FREQ', operator: 'in' as const, values: ['A'] }],
});

// ---------------------------------------------------------------------------
// getTimeRangeFromDataQueries
// ---------------------------------------------------------------------------

describe('getTimeRangeFromDataQueries', () => {
  beforeEach(() => {
    mockGetTimePeriod.mockReset();
  });

  it('returns null when called with undefined', () => {
    expect(getTimeRangeFromDataQueries(undefined)).toBeNull();
  });

  it('returns null for an empty array', () => {
    expect(getTimeRangeFromDataQueries([])).toBeNull();
  });

  it('returns null when no query has a TIME_PERIOD filter', () => {
    const queries = [makeQueryWithoutTimePeriod()];
    expect(getTimeRangeFromDataQueries(queries)).toBeNull();
  });

  it('returns null when TIME_PERIOD filter values are empty', () => {
    mockGetTimePeriod.mockReturnValue(null);
    const queries = [makeQuery([])];
    expect(getTimeRangeFromDataQueries(queries)).toBeNull();
  });

  it('returns null when getTimePeriod cannot parse the start value', () => {
    mockGetTimePeriod.mockReturnValueOnce(null).mockReturnValueOnce(END);
    const queries = [makeQuery(['bad-date', '2023-12-31'])];
    expect(getTimeRangeFromDataQueries(queries)).toBeNull();
  });

  it('returns null when getTimePeriod cannot parse the end value', () => {
    mockGetTimePeriod.mockReturnValueOnce(START).mockReturnValueOnce(null);
    const queries = [makeQuery(['2018-01-01', 'bad-date'])];
    expect(getTimeRangeFromDataQueries(queries)).toBeNull();
  });

  it('returns a TimeRange when both period values are parseable', () => {
    mockGetTimePeriod.mockReturnValueOnce(START).mockReturnValueOnce(END);
    const queries = [makeQuery(['2018-01-01', '2023-12-31'])];
    expect(getTimeRangeFromDataQueries(queries)).toEqual({
      startPeriod: START,
      endPeriod: END,
    });
  });

  it('skips a query without a TIME_PERIOD filter and returns from the next one', () => {
    mockGetTimePeriod.mockReturnValueOnce(START).mockReturnValueOnce(END);
    const queries = [
      makeQueryWithoutTimePeriod(),
      makeQuery(['2018-01-01', '2023-12-31']),
    ];
    expect(getTimeRangeFromDataQueries(queries)).toEqual({
      startPeriod: START,
      endPeriod: END,
    });
  });

  it('skips a query with unparseable dates and returns from the next one', () => {
    mockGetTimePeriod
      .mockReturnValueOnce(null) // first query start (unparseable)
      .mockReturnValueOnce(null) // first query end (still called)
      .mockReturnValueOnce(START) // second query start
      .mockReturnValueOnce(END); // second query end
    const queries = [
      makeQuery(['bad', '2023-12-31']),
      makeQuery(['2018-01-01', '2023-12-31']),
    ];
    expect(getTimeRangeFromDataQueries(queries)).toEqual({
      startPeriod: START,
      endPeriod: END,
    });
  });

  it('returns null when all queries have unparseable TIME_PERIOD values', () => {
    mockGetTimePeriod.mockReturnValue(null);
    const queries = [makeQuery(['bad1', 'bad2']), makeQuery(['bad3', 'bad4'])];
    expect(getTimeRangeFromDataQueries(queries)).toBeNull();
  });

  // TIME_PERIOD is a shared dimension in multi-dataset queries. The function merges
  // all valid ranges by taking the earliest start and latest end across all queries.
  describe('multiple queries with TIME_PERIOD (shared dimension — merged range)', () => {
    it('returns the shared range when all queries carry identical TIME_PERIOD values', () => {
      mockGetTimePeriod
        .mockReturnValueOnce(START)
        .mockReturnValueOnce(END) // query 1
        .mockReturnValueOnce(START)
        .mockReturnValueOnce(END); // query 2
      const queries = [
        makeQuery(['2018-01-01', '2023-12-31']),
        makeQuery(['2018-01-01', '2023-12-31']),
      ];
      expect(getTimeRangeFromDataQueries(queries)).toEqual({
        startPeriod: START,
        endPeriod: END,
      });
    });

    it('merges ranges: takes the earliest start and latest end across queries', () => {
      const EARLIER_START = new Date('2015-01-01');
      const LATER_END = new Date('2025-12-31');
      mockGetTimePeriod
        .mockReturnValueOnce(START) // query 1 start (2018)
        .mockReturnValueOnce(END) // query 1 end   (2023)
        .mockReturnValueOnce(EARLIER_START) // query 2 start (2015) — earlier
        .mockReturnValueOnce(LATER_END); // query 2 end   (2025) — later
      const queries = [
        makeQuery(['2018-01-01', '2023-12-31']),
        makeQuery(['2015-01-01', '2025-12-31']),
      ];
      expect(getTimeRangeFromDataQueries(queries)).toEqual({
        startPeriod: EARLIER_START,
        endPeriod: LATER_END,
      });
    });

    it('ignores a query with an invalid TIME_PERIOD and merges the remaining ones', () => {
      mockGetTimePeriod
        .mockReturnValueOnce(null) // query 1 start (unparseable)
        .mockReturnValueOnce(null) // query 1 end
        .mockReturnValueOnce(START) // query 2 start
        .mockReturnValueOnce(END); // query 2 end
      const queries = [
        makeQuery(['bad', 'bad']),
        makeQuery(['2018-01-01', '2023-12-31']),
      ];
      expect(getTimeRangeFromDataQueries(queries)).toEqual({
        startPeriod: START,
        endPeriod: END,
      });
    });

    it('returns null when no query in the array carries a valid TIME_PERIOD', () => {
      mockGetTimePeriod.mockReturnValue(null);
      const queries = [
        makeQuery(['bad', 'bad']),
        makeQueryWithoutTimePeriod(),
        makeQuery(['also-bad', 'also-bad']),
      ];
      expect(getTimeRangeFromDataQueries(queries)).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// getMergedInitialConstraints
// ---------------------------------------------------------------------------

describe('getMergedInitialConstraints', () => {
  describe('selectedTimeRange is null', () => {
    it('returns initialTimeRange unchanged', () => {
      const initial = range('2020-01-01', '2023-12-31');
      expect(getMergedInitialConstraints(initial, null)).toEqual(initial);
    });

    it('returns initialTimeRange unchanged when both periods are null', () => {
      const initial = range(null, null);
      expect(getMergedInitialConstraints(initial, null)).toEqual(
        range(null, null),
      );
    });
  });

  describe('initialTimeRange has no startPeriod', () => {
    it('uses selected.startPeriod when initial.startPeriod is null', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range(null, '2023-12-31'),
        range('2019-06-01', null),
      );
      expect(startPeriod).toEqual(d('2019-06-01'));
      expect(endPeriod).toEqual(d('2023-12-31'));
    });
  });

  describe('initialTimeRange has no endPeriod', () => {
    it('uses selected.endPeriod when initial.endPeriod is null', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', null),
        range(null, '2025-06-01'),
      );
      expect(startPeriod).toEqual(d('2020-01-01'));
      expect(endPeriod).toEqual(d('2025-06-01'));
    });
  });

  describe('both periods null in initialTimeRange', () => {
    it('uses both periods from selected', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range(null, null),
        range('2019-01-01', '2024-12-31'),
      );
      expect(startPeriod).toEqual(d('2019-01-01'));
      expect(endPeriod).toEqual(d('2024-12-31'));
    });
  });

  describe('startPeriod comparison', () => {
    it('uses selected.startPeriod when it is earlier than initial.startPeriod', () => {
      const { startPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2018-06-01', '2022-01-01'),
      );
      expect(startPeriod).toEqual(d('2018-06-01'));
    });

    it('keeps initial.startPeriod when selected.startPeriod is later', () => {
      const { startPeriod } = getMergedInitialConstraints(
        range('2018-01-01', '2023-12-31'),
        range('2020-06-01', '2022-01-01'),
      );
      expect(startPeriod).toEqual(d('2018-01-01'));
    });

    it('keeps initial.startPeriod when both startPeriods are equal', () => {
      const { startPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2020-01-01', '2022-01-01'),
      );
      expect(startPeriod).toEqual(d('2020-01-01'));
    });
  });

  describe('endPeriod comparison', () => {
    it('uses selected.endPeriod when it is later than initial.endPeriod', () => {
      const { endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2021-01-01', '2025-06-01'),
      );
      expect(endPeriod).toEqual(d('2025-06-01'));
    });

    it('keeps initial.endPeriod when selected.endPeriod is earlier', () => {
      const { endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2021-01-01', '2022-06-01'),
      );
      expect(endPeriod).toEqual(d('2023-12-31'));
    });

    it('keeps initial.endPeriod when both endPeriods are equal', () => {
      const { endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2021-01-01', '2023-12-31'),
      );
      expect(endPeriod).toEqual(d('2023-12-31'));
    });
  });

  describe('both boundaries expanded', () => {
    it('expands both startPeriod and endPeriod when selected is wider', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2017-03-15', '2026-09-01'),
      );
      expect(startPeriod).toEqual(d('2017-03-15'));
      expect(endPeriod).toEqual(d('2026-09-01'));
    });
  });

  describe('selectedTimeRange is within initial bounds', () => {
    it('returns initial unchanged when selected is completely within it', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range('2018-01-01', '2025-12-31'),
        range('2020-06-01', '2023-06-01'),
      );
      expect(startPeriod).toEqual(d('2018-01-01'));
      expect(endPeriod).toEqual(d('2025-12-31'));
    });
  });

  describe('selectedTimeRange has no periods', () => {
    it('keeps initial when selected has null startPeriod and endPeriod', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range(null, null),
      );
      expect(startPeriod).toEqual(d('2020-01-01'));
      expect(endPeriod).toEqual(d('2023-12-31'));
    });
  });

  describe('immutability', () => {
    it('does not mutate the initialTimeRange object', () => {
      const initial = range('2020-01-01', '2023-12-31');
      const { startPeriod: origStart, endPeriod: origEnd } = initial;
      getMergedInitialConstraints(initial, range('2017-01-01', '2026-12-31'));
      expect(initial.startPeriod).toBe(origStart);
      expect(initial.endPeriod).toBe(origEnd);
    });
  });
});
