import {
  buildDataQueryWithMergedFilters,
  getQueryFilters,
  getQueryTimeSeriesFilters,
  getTimeQueryFilterFromAttachment,
  setDataQueryFilters,
} from '../query-filters';
import type { Filter } from '../../models/filters';

// ─── Mock functions ───────────────────────────────────────────────────────────

const mockGetSelectedFilterValues = jest.fn((f: Filter[]) => f);
const mockGetFiltersForQueryContext = jest.fn((f: Filter[]) => f);
const mockGetTimeRangeFromAttachment = jest.fn(() => null as any);
const mockGetQueryTimePeriodFilters = jest.fn(() => null as any);
const mockGetTimeSeriesFilterKey = jest.fn(() => null as any);

jest.mock('../filters', () => ({
  getSelectedFilterValues: (...args: any[]) =>
    (mockGetSelectedFilterValues as any)(...args),
}));

jest.mock('../multiple-filters', () => ({
  getFiltersForQueryContext: (...args: any[]) =>
    (mockGetFiltersForQueryContext as any)(...args),
}));

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  GET_v3_FILTER_ALL: '*',
  getTimeRangeFromAttachment: (...args: any[]) =>
    (mockGetTimeRangeFromAttachment as any)(...args),
  getQueryTimePeriodFilters: (...args: any[]) =>
    (mockGetQueryTimePeriodFilters as any)(...args),
  getTimeSeriesFilterKey: (...args: any[]) =>
    (mockGetTimeSeriesFilterKey as any)(...args),
}));

jest.mock('@epam/statgpt-shared-toolkit', () => ({
  QueryFilterType: { IN: 'in', BETWEEN: 'between' },
}));

// ─── Default mock reset ───────────────────────────────────────────────────────

beforeEach(() => {
  mockGetSelectedFilterValues.mockImplementation((f: Filter[]) => f);
  mockGetFiltersForQueryContext.mockImplementation((f: Filter[]) => f);
  mockGetTimeRangeFromAttachment.mockReturnValue(null);
  mockGetQueryTimePeriodFilters.mockReturnValue(null);
  mockGetTimeSeriesFilterKey.mockReturnValue(null);
});

// ─── getQueryTimeSeriesFilters ────────────────────────────────────────────────

describe('getQueryTimeSeriesFilters', () => {
  it('maps each filter to a QueryFilter with IN operator and all dimension value ids', () => {
    const filters: Filter[] = [
      {
        id: 'COUNTRY',
        filterType: 'dataset',
        dimensionValues: [
          { id: 'FR', isSelectedValue: true },
          { id: 'DE', isSelectedValue: false },
        ],
      },
    ];

    const result = getQueryTimeSeriesFilters(filters);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      componentCode: 'COUNTRY',
      operator: 'in',
      values: ['FR', 'DE'],
    });
  });

  it('uses empty values array when dimensionValues is undefined', () => {
    const filter: Filter = { id: 'FREQ', filterType: 'dataset' };
    const result = getQueryTimeSeriesFilters([filter]);
    expect(result[0].values).toEqual([]);
  });
});

// ─── getTimeQueryFilterFromAttachment ─────────────────────────────────────────

describe('getTimeQueryFilterFromAttachment', () => {
  const dataQuery = { urn: 'AGENCY:DF(1.0)', filters: [] } as any;

  it('returns null when dimensions is undefined', () => {
    expect(getTimeQueryFilterFromAttachment(dataQuery, undefined)).toBeNull();
  });

  it('returns null when getTimeRangeFromAttachment returns null', () => {
    mockGetTimeRangeFromAttachment.mockReturnValue(null);
    const dimensions = { timeDimensions: [{ id: 'TIME_PERIOD' }] } as any;
    expect(getTimeQueryFilterFromAttachment(dataQuery, dimensions)).toBeNull();
  });

  it('returns the filter string when a time range is found', () => {
    const timeRange = {
      startPeriod: new Date('2020-01-01'),
      endPeriod: new Date('2023-12-31'),
    };
    mockGetTimeRangeFromAttachment.mockReturnValue(timeRange);
    mockGetQueryTimePeriodFilters.mockReturnValue('2020-Q1:2023-Q4');

    const dimensions = { timeDimensions: [{ id: 'TIME_PERIOD' }] } as any;
    const result = getTimeQueryFilterFromAttachment(dataQuery, dimensions);

    expect(result).toBe('2020-Q1:2023-Q4');
    expect(mockGetQueryTimePeriodFilters).toHaveBeenCalledWith(
      timeRange,
      'TIME_PERIOD',
    );
  });
});

// ─── getQueryFilters ──────────────────────────────────────────────────────────

describe('getQueryFilters', () => {
  it('returns filterKey from getTimeSeriesFilterKey', () => {
    mockGetTimeSeriesFilterKey.mockReturnValue('key-123');
    const result = getQueryFilters([], []);
    expect(result.filterKey).toBe('key-123');
  });

  it('returns timeFilter from getQueryTimePeriodFilters when a time dimension filter is present', () => {
    const timeRange = {
      startPeriod: new Date('2020-01-01'),
      endPeriod: new Date('2023-12-31'),
    };
    const timeDimFilter: Filter = {
      id: 'TIME_PERIOD',
      filterType: 'dataset',
      isTimeDimension: true,
      timeRange,
    };
    mockGetSelectedFilterValues.mockReturnValue([timeDimFilter]);
    mockGetQueryTimePeriodFilters.mockReturnValue('2020-Q1:2023-Q4');

    const result = getQueryFilters([timeDimFilter]);

    expect(result.timeFilter).toBe('2020-Q1:2023-Q4');
    expect(mockGetQueryTimePeriodFilters).toHaveBeenCalledWith(
      timeRange,
      'TIME_PERIOD',
    );
  });

  it('returns null timeFilter when no time dimension filter has a timeRange', () => {
    const filter: Filter = {
      id: 'COUNTRY',
      filterType: 'dataset',
      dimensionValues: [{ id: 'FR', isSelectedValue: true }],
    };
    mockGetSelectedFilterValues.mockReturnValue([filter]);

    const result = getQueryFilters([filter]);

    expect(result.timeFilter).toBeNull();
  });
});

// ─── setDataQueryFilters ──────────────────────────────────────────────────────

describe('setDataQueryFilters', () => {
  it('excludes filters with no selected values and no timeRange', () => {
    const filter: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      dimensionValues: [{ id: 'A', isSelectedValue: false }],
    };

    expect(setDataQueryFilters([filter])).toEqual([]);
  });

  it('builds an IN filter with selected value ids for a regular filter', () => {
    const filter: Filter = {
      id: 'COUNTRY',
      filterType: 'dataset',
      dimensionValues: [
        { id: 'FR', isSelectedValue: true },
        { id: 'DE', isSelectedValue: false },
      ],
    };

    const result = setDataQueryFilters([filter]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      componentCode: 'COUNTRY',
      operator: 'in',
      values: ['FR'],
    });
  });

  it('builds a BETWEEN filter with MM-DD-YYYY formatted dates for a time dimension filter', () => {
    const filter: Filter = {
      id: 'TIME_PERIOD',
      filterType: 'dataset',
      isTimeDimension: true,
      timeRange: {
        startPeriod: new Date(2020, 0, 5),
        endPeriod: new Date(2023, 11, 31),
      },
    };

    const result = setDataQueryFilters([filter]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      componentCode: 'TIME_PERIOD',
      operator: 'between',
      values: ['01-05-2020', '12-31-2023'],
    });
  });
});

// ─── buildDataQueryWithMergedFilters ─────────────────────────────────────────

describe('buildDataQueryWithMergedFilters', () => {
  it('replaces stale original filters with wildcard when UI has no selected values', () => {
    const dataQuery = {
      urn: 'AGENCY:DF_A(1.0)',
      filters: [
        {
          componentCode: 'FREQ',
          operator: 'in',
          values: ['D'],
        },
        {
          componentCode: 'INDICATOR',
          operator: 'in',
          values: ['GDP'],
        },
      ],
    } as any;
    const uiFilters: Filter[] = [
      {
        id: 'FREQ',
        filterType: 'dataset',
        datasetUrn: dataQuery.urn,
        dimensionValues: [{ id: 'M', isSelectedValue: false }],
      },
    ];

    mockGetFiltersForQueryContext.mockReturnValue(uiFilters);

    expect(
      buildDataQueryWithMergedFilters(dataQuery, uiFilters).filters,
    ).toEqual([
      {
        componentCode: 'INDICATOR',
        operator: 'in',
        values: ['GDP'],
      },
      {
        componentCode: 'FREQ',
        operator: 'in',
        values: ['*'],
      },
    ]);
  });

  it('replaces stale original filters with wildcard for a shared filter source id', () => {
    const dataQuery = {
      urn: 'AGENCY:DF_B(1.0)',
      filters: [
        {
          componentCode: 'FREQUENCY',
          operator: 'in',
          values: ['D'],
        },
      ],
    } as any;
    const sharedFilter: Filter = {
      id: 'FREQUENCY',
      filterType: 'shared',
      sourceFilterIdsByDataset: {
        [dataQuery.urn]: 'FREQUENCY',
      },
      dimensionValues: [
        {
          id: 'name:daily',
          name: 'Daily',
          isSelectedValue: true,
          sourceValues: [{ datasetUrn: 'AGENCY:DF_A(1.0)', id: 'D' }],
        },
      ],
    };

    mockGetFiltersForQueryContext.mockReturnValue([]);

    expect(
      buildDataQueryWithMergedFilters(dataQuery, [sharedFilter]).filters,
    ).toEqual([
      {
        componentCode: 'FREQUENCY',
        operator: 'in',
        values: ['*'],
      },
    ]);
  });

  it('expands shared selected filters for the matching dataset when building python queries', () => {
    const dataQuery = {
      urn: 'AGENCY:DF_A(1.0)',
      filters: [],
    } as any;
    const sharedFilter: Filter = {
      id: 'FREQUENCY',
      filterType: 'shared',
      sourceFilterIdsByDataset: {
        [dataQuery.urn]: 'FREQ',
      },
      dimensionValues: [
        {
          id: 'name:quarterly',
          name: 'Quarterly',
          isSelectedValue: true,
          sourceValues: [
            { datasetUrn: dataQuery.urn, id: 'Q', name: 'Quarterly' },
          ],
        },
      ],
    };
    const expandedFilter: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      datasetUrn: dataQuery.urn,
      dimensionValues: [{ id: 'Q', isSelectedValue: true }],
    };

    mockGetFiltersForQueryContext.mockReturnValue([expandedFilter]);

    expect(
      buildDataQueryWithMergedFilters(dataQuery, [sharedFilter]).filters,
    ).toEqual([
      {
        componentCode: 'FREQ',
        operator: 'in',
        values: ['Q'],
      },
    ]);
    expect(mockGetFiltersForQueryContext).toHaveBeenCalledWith(
      [sharedFilter],
      dataQuery.urn,
    );
  });
});
