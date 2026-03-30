import {
  getSeriesFilterDto,
  getTimeFilter,
  getTimeSeriesFilterDto,
  ONE_DAY_MS,
} from '../get-series-filters';
import type { Filter } from '../../models/filters';

// ─── Mock functions ───────────────────────────────────────────────────────────

const mockGetFiltersForQueryContext = jest.fn((filters: Filter[]) => filters);

jest.mock('../multiple-filters', () => ({
  getFiltersForQueryContext: (...args: any[]) =>
    (mockGetFiltersForQueryContext as any)(...args),
}));

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  GET_v3_FILTER_AND: '+',
  SeriesFilterOperator: {
    EQUALS: 'eq',
    GREATER_OR_EQUAL: 'ge',
    LESS_OR_EQUAL: 'le',
  },
}));

jest.mock('@epam/statgpt-shared-toolkit', () => ({}));

// ─── Default mock reset ───────────────────────────────────────────────────────

beforeEach(() => {
  mockGetFiltersForQueryContext.mockImplementation(
    (filters: Filter[]) => filters,
  );
});

// ─── getTimeFilter ────────────────────────────────────────────────────────────

describe('getTimeFilter', () => {
  it('returns a string', () => {
    expect(typeof getTimeFilter(new Date('2020-06-15'))).toBe('string');
  });

  it('with increment adds ONE_DAY_MS - 1 milliseconds to the base value', () => {
    const date = new Date('2020-06-15');
    const base = Number(getTimeFilter(new Date(date)));
    const incremented = Number(getTimeFilter(new Date(date), 1));
    expect(incremented - base).toBe(ONE_DAY_MS - 1);
  });
});

// ─── getTimeSeriesFilterDto ───────────────────────────────────────────────────

describe('getTimeSeriesFilterDto', () => {
  it('returns [] when timeRange is null', () => {
    expect(getTimeSeriesFilterDto(null, 'TIME_PERIOD')).toEqual([]);
  });

  it('returns [] when timeRange is undefined', () => {
    expect(getTimeSeriesFilterDto(undefined, 'TIME_PERIOD')).toEqual([]);
  });

  it('returns [] when startPeriod is null', () => {
    expect(
      getTimeSeriesFilterDto(
        { startPeriod: null, endPeriod: new Date('2023-12-31') },
        'TIME_PERIOD',
      ),
    ).toEqual([]);
  });

  it('returns [] when endPeriod is null', () => {
    expect(
      getTimeSeriesFilterDto(
        { startPeriod: new Date('2020-01-01'), endPeriod: null },
        'TIME_PERIOD',
      ),
    ).toEqual([]);
  });

  it('returns two DTOs with correct operators and componentCode when both periods are set', () => {
    const result = getTimeSeriesFilterDto(
      {
        startPeriod: new Date('2020-01-01'),
        endPeriod: new Date('2023-12-31'),
      },
      'TIME_PERIOD',
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      componentCode: 'TIME_PERIOD',
      operator: 'ge',
    });
    expect(result[1]).toMatchObject({
      componentCode: 'TIME_PERIOD',
      operator: 'le',
    });
  });

  it('end value is greater than start value due to end-of-day increment', () => {
    const result = getTimeSeriesFilterDto(
      {
        startPeriod: new Date('2020-01-01'),
        endPeriod: new Date('2020-01-01'),
      },
      'TIME_PERIOD',
    );

    expect(Number(result[1].value)).toBeGreaterThan(Number(result[0].value));
  });
});

// ─── getSeriesFilterDto ───────────────────────────────────────────────────────

describe('getSeriesFilterDto', () => {
  it('excludes filters with no selected values and no timeRange', () => {
    const filter: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      dimensionValues: [{ id: 'A', isSelectedValue: false }],
    };

    expect(getSeriesFilterDto([filter])).toEqual([]);
  });

  it('builds a DTO for a regular filter with selected dimension values joined by GET_v3_FILTER_AND', () => {
    const filter: Filter = {
      id: 'COUNTRY',
      filterType: 'dataset',
      dimensionValues: [
        { id: 'FR', isSelectedValue: true },
        { id: 'DE', isSelectedValue: true },
        { id: 'ES', isSelectedValue: false },
      ],
    };

    const result = getSeriesFilterDto([filter]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      componentCode: 'COUNTRY',
      operator: 'eq',
      value: 'FR+DE',
    });
  });

  it('produces time series DTOs for a time dimension filter', () => {
    const filter: Filter = {
      id: 'TIME_PERIOD',
      filterType: 'dataset',
      isTimeDimension: true,
      timeRange: {
        startPeriod: new Date('2020-01-01'),
        endPeriod: new Date('2023-12-31'),
      },
    };

    const result = getSeriesFilterDto([filter]);

    expect(result).toHaveLength(2);
    expect(result[0].operator).toBe('ge');
    expect(result[1].operator).toBe('le');
  });

  it('passes filters and datasetUrn to getFiltersForQueryContext', () => {
    const filters: Filter[] = [{ id: 'FREQ', filterType: 'dataset' }];
    mockGetFiltersForQueryContext.mockReturnValue([]);

    getSeriesFilterDto(filters, 'AGENCY:DF(1.0)');

    expect(mockGetFiltersForQueryContext).toHaveBeenCalledWith(
      filters,
      'AGENCY:DF(1.0)',
    );
  });
});
