import { getTimeRangeFromDataQueries } from '../time-period';

jest.mock('@epam/statgpt-shared-toolkit', () => ({
  getTimePeriod: jest.fn(),
}));

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  TIME_PERIOD: 'TIME_PERIOD',
  isMonthly: jest.fn(),
  isQuarterly: jest.fn(),
}));

import { getTimePeriod } from '@epam/statgpt-shared-toolkit';

const mockGetTimePeriod = getTimePeriod as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const START = new Date('2018-01-01');
const END = new Date('2023-12-31');

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
