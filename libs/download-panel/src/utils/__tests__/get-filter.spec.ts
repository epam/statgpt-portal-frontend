import {
  DatasetQueryFilters,
  Dimension,
  DownloadType,
  getTimeDimension,
  getTimeQueryFilter,
  getTimeSeriesFilterKey,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery, QueryFilterType } from '@epam/statgpt-shared-toolkit';
import { getDownloadFilters, hasSelectedFilters } from '../get-filter';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  DownloadType: { FULL_DATASET: 'full', DATA_IN_TABLE: 'query' },
  GET_v3_FILTER_OR: '+',
  getTimeQueryFilter: jest.fn(),
  getTimeSeriesFilterKey: jest.fn(),
  getTimeDimension: jest.fn(),
}));

const mockGetTimeQueryFilter = getTimeQueryFilter as jest.Mock;
const mockGetTimeSeriesFilterKey = getTimeSeriesFilterKey as jest.Mock;
const mockGetTimeDimension = getTimeDimension as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDataQuery(
  metadataOverrides: Partial<DataQuery['metadata']> = {},
  filters: DataQuery['filters'] = [],
): DataQuery {
  return {
    urn: 'urn:sdmx:org.sdmx.infomodel.datastructure.Dataflow=AGENCY:DS_ID(1.0)',
    metadata: {
      countryDimension: 'REF_AREA',
      indicatorDimensions: ['INDICATOR'],
      ...metadataOverrides,
    },
    filters,
  };
}

function makeFilter(
  componentCode: string,
  values: string[],
  operator: QueryFilterType = QueryFilterType.IN,
) {
  return { componentCode, operator, values };
}

function makeDimension(id: string): Dimension {
  return { id } as Dimension;
}

// ---------------------------------------------------------------------------
// getDownloadFilters — metadata path (keyDimensionIdsInDsdOrder)
// ---------------------------------------------------------------------------

describe('getDownloadFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTimeQueryFilter.mockReturnValue(null);
  });

  describe('metadata path — keyDimensionIdsInDsdOrder present', () => {
    it('builds filterKey from dimension order in metadata', () => {
      const dataQuery = makeDataQuery(
        { keyDimensionIdsInDsdOrder: ['FREQ', 'REF_AREA'] },
        [makeFilter('FREQ', ['A']), makeFilter('REF_AREA', ['BOL'])],
      );

      const result = getDownloadFilters(DownloadType.DATA_IN_TABLE, dataQuery);

      expect(result.filterKey).toBe('A.BOL');
    });

    it('uses * for dimensions that have no matching filter', () => {
      const dataQuery = makeDataQuery(
        { keyDimensionIdsInDsdOrder: ['FREQ', 'REF_AREA', 'INDICATOR'] },
        [makeFilter('REF_AREA', ['BOL'])],
      );

      const result = getDownloadFilters(DownloadType.DATA_IN_TABLE, dataQuery);

      expect(result.filterKey).toBe('*.BOL.*');
    });

    it('uses * for dimensions that have an empty values array', () => {
      const dataQuery = makeDataQuery(
        { keyDimensionIdsInDsdOrder: ['FREQ', 'REF_AREA'] },
        [makeFilter('FREQ', []), makeFilter('REF_AREA', ['BOL'])],
      );

      const result = getDownloadFilters(DownloadType.DATA_IN_TABLE, dataQuery);

      expect(result.filterKey).toBe('*.BOL');
    });

    it('joins multiple values for a single dimension with "+"', () => {
      const dataQuery = makeDataQuery(
        { keyDimensionIdsInDsdOrder: ['REF_AREA'] },
        [makeFilter('REF_AREA', ['BOL', 'CZE', 'DEU'])],
      );

      const result = getDownloadFilters(DownloadType.DATA_IN_TABLE, dataQuery);

      expect(result.filterKey).toBe('BOL+CZE+DEU');
    });

    it('returns the timeFilter from getTimeQueryFilter', () => {
      mockGetTimeQueryFilter.mockReturnValue('c%5BTIME_PERIOD%5D=ge%3A2020');
      const dataQuery = makeDataQuery({
        keyDimensionIdsInDsdOrder: ['FREQ'],
        timePeriodDimension: 'TIME_PERIOD',
      });

      const result = getDownloadFilters(DownloadType.DATA_IN_TABLE, dataQuery);

      expect(result.timeFilter).toBe('c%5BTIME_PERIOD%5D=ge%3A2020');
    });

    it('calls getTimeQueryFilter with the timePeriodDimension id from metadata', () => {
      const dataQuery = makeDataQuery({
        keyDimensionIdsInDsdOrder: ['FREQ'],
        timePeriodDimension: 'TIME_PERIOD',
      });

      getDownloadFilters(DownloadType.DATA_IN_TABLE, dataQuery);

      expect(mockGetTimeQueryFilter).toHaveBeenCalledWith(
        dataQuery,
        expect.objectContaining({ id: 'TIME_PERIOD' }),
      );
    });

    it('returns null timeFilter when timePeriodDimension is absent from metadata', () => {
      const dataQuery = makeDataQuery({ keyDimensionIdsInDsdOrder: ['FREQ'] });

      const result = getDownloadFilters(DownloadType.DATA_IN_TABLE, dataQuery);

      expect(result.timeFilter).toBeNull();
      expect(mockGetTimeQueryFilter).not.toHaveBeenCalled();
    });

    it('takes priority over pre-stored filters', () => {
      const dataQuery = makeDataQuery({ keyDimensionIdsInDsdOrder: ['FREQ'] }, [
        makeFilter('FREQ', ['A']),
      ]);
      const preStored: DatasetQueryFilters = {
        filterKey: 'SHOULD_NOT_BE_USED',
        timeFilter: null,
      };

      const result = getDownloadFilters(
        DownloadType.DATA_IN_TABLE,
        dataQuery,
        undefined,
        preStored,
      );

      expect(result.filterKey).toBe('A');
    });

    it('takes priority over the dimensions fallback path', () => {
      mockGetTimeSeriesFilterKey.mockReturnValue('SHOULD_NOT_BE_USED');
      const dataQuery = makeDataQuery({ keyDimensionIdsInDsdOrder: ['FREQ'] }, [
        makeFilter('FREQ', ['A']),
      ]);

      getDownloadFilters(DownloadType.DATA_IN_TABLE, dataQuery, [
        makeDimension('FREQ'),
      ]);

      expect(mockGetTimeSeriesFilterKey).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getDownloadFilters — pre-stored filters path
  // -------------------------------------------------------------------------

  describe('pre-stored filters path — no metadata, filterKey already computed', () => {
    it('returns the pre-stored filters as-is', () => {
      const dataQuery = makeDataQuery();
      const preStored: DatasetQueryFilters = {
        filterKey: 'A.BOL',
        timeFilter: 'c%5BTIME_PERIOD%5D=ge%3A2020',
      };

      const result = getDownloadFilters(
        DownloadType.DATA_IN_TABLE,
        dataQuery,
        undefined,
        preStored,
      );

      expect(result).toBe(preStored);
    });

    it('does not use pre-stored filters when type is not DATA_IN_TABLE', () => {
      const preStored: DatasetQueryFilters = {
        filterKey: 'A.BOL',
        timeFilter: null,
      };

      const result = getDownloadFilters(null, undefined, undefined, preStored);

      expect(result).toEqual({ filterKey: null, timeFilter: null });
    });

    it('does not use pre-stored filters when filterKey is null', () => {
      const dataQuery = makeDataQuery();
      const preStored: DatasetQueryFilters = {
        filterKey: null,
        timeFilter: null,
      };

      const result = getDownloadFilters(
        DownloadType.DATA_IN_TABLE,
        dataQuery,
        undefined,
        preStored,
      );

      expect(result.filterKey).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // getDownloadFilters — dimensions fallback path
  // -------------------------------------------------------------------------

  describe('dimensions fallback path — no metadata, no pre-stored filterKey', () => {
    it('delegates filterKey and timeFilter to the sdmx-toolkit functions', () => {
      mockGetTimeSeriesFilterKey.mockReturnValue('A.BOL');
      mockGetTimeQueryFilter.mockReturnValue('c%5BTIME_PERIOD%5D=ge%3A2020');
      const timeDim = makeDimension('TIME_PERIOD');
      mockGetTimeDimension.mockReturnValue(timeDim);
      const dataQuery = makeDataQuery({}, [
        makeFilter('FREQ', ['A']),
        makeFilter('REF_AREA', ['BOL']),
      ]);
      const dimensions = [makeDimension('FREQ'), makeDimension('REF_AREA')];

      const result = getDownloadFilters(
        DownloadType.DATA_IN_TABLE,
        dataQuery,
        dimensions,
      );

      expect(result.filterKey).toBe('A.BOL');
      expect(result.timeFilter).toBe('c%5BTIME_PERIOD%5D=ge%3A2020');
    });

    it('passes dimensions and dataQuery filters to getTimeSeriesFilterKey', () => {
      mockGetTimeSeriesFilterKey.mockReturnValue('*.*');
      mockGetTimeDimension.mockReturnValue(makeDimension('TIME_PERIOD'));
      const dataQuery = makeDataQuery({}, [makeFilter('FREQ', ['A'])]);
      const dimensions = [makeDimension('FREQ'), makeDimension('REF_AREA')];

      getDownloadFilters(DownloadType.DATA_IN_TABLE, dataQuery, dimensions);

      expect(mockGetTimeSeriesFilterKey).toHaveBeenCalledWith(
        dimensions,
        dataQuery.filters,
      );
    });

    it('returns null filterKey and timeFilter when no dataQuery is provided', () => {
      const result = getDownloadFilters(DownloadType.DATA_IN_TABLE, undefined, [
        makeDimension('FREQ'),
      ]);

      expect(result).toEqual({ filterKey: null, timeFilter: null });
    });

    it('returns null filterKey and timeFilter when no dimensions are provided', () => {
      const dataQuery = makeDataQuery({}, [makeFilter('FREQ', ['A'])]);

      const result = getDownloadFilters(
        DownloadType.DATA_IN_TABLE,
        dataQuery,
        undefined,
      );

      expect(result).toEqual({ filterKey: null, timeFilter: null });
    });

    it('returns null filterKey and timeFilter when type is not DATA_IN_TABLE', () => {
      mockGetTimeSeriesFilterKey.mockReturnValue('A.BOL');
      const dataQuery = makeDataQuery({}, [makeFilter('FREQ', ['A'])]);

      const result = getDownloadFilters(null, dataQuery, [
        makeDimension('FREQ'),
      ]);

      expect(result).toEqual({ filterKey: null, timeFilter: null });
      expect(mockGetTimeSeriesFilterKey).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// hasSelectedFilters
// ---------------------------------------------------------------------------

describe('hasSelectedFilters', () => {
  it('returns truthy when at least one segment is not a wildcard', () => {
    expect(hasSelectedFilters(['*', 'BOL', '*'])).toBeTruthy();
  });

  it('returns truthy for a single non-wildcard segment', () => {
    expect(hasSelectedFilters(['A'])).toBeTruthy();
  });

  it('returns falsy when every segment is a wildcard', () => {
    expect(hasSelectedFilters(['*', '*', '*'])).toBeFalsy();
  });

  it('returns falsy for an empty array', () => {
    expect(hasSelectedFilters([])).toBeFalsy();
  });

  it('returns falsy for undefined', () => {
    expect(hasSelectedFilters(undefined)).toBeFalsy();
  });
});
