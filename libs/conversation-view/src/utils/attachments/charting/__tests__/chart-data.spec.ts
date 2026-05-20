import {
  getDimensions,
  getLocalizedName,
  getTimePeriods,
  isMonthly,
  isQuarterly,
  isYearly,
  sortPeriods,
} from '@epam/statgpt-sdmx-toolkit';
import { getRowsData } from '../../data-grid/rows-data';
import { buildChartConfig } from '../chart-config-building';
import {
  buildChartData,
  buildSingleLineUnit,
  buildUnit,
  createChartDataResolver,
} from '../chart-data';
import { getDimensionsUniquenessByValues } from '../data-uniqueness';
import { buildSerieKeyTitle } from '../serie-title';
import { buildSortedNonRegionDimensionsList } from '../sort-dimensions';
import { splitForUnits } from '../split-for-units';
import { getDimRelatedStructures } from '../../localized-value';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  FREQUENCY_DIMENSION_ID: ['FREQ', 'FREQUENCY'],
  Periods: { ANNUAL: 'A', QUARTERLY: 'Q', MONTHLY: 'M' },
  getDimensions: jest.fn(),
  getLocalizedName: jest.fn(),
  getTimePeriods: jest.fn(),
  isMonthly: jest.fn(),
  isQuarterly: jest.fn(),
  isYearly: jest.fn(),
  sortPeriods: jest.fn(),
}));

jest.mock('../../data-grid/rows-data', () => ({
  getRowsData: jest.fn(),
}));

jest.mock('../chart-config-building', () => ({
  buildChartConfig: jest.fn(),
}));

jest.mock('../data-uniqueness', () => ({
  getDimensionsUniquenessByValues: jest.fn(),
}));

jest.mock('../serie-title', () => ({
  buildSerieKeyTitle: jest.fn(),
}));

jest.mock('../sort-dimensions', () => ({
  buildSortedNonRegionDimensionsList: jest.fn(),
}));

jest.mock('../split-for-units', () => ({
  splitForUnits: jest.fn(),
}));

jest.mock('../../localized-value', () => ({
  getDimRelatedStructures: jest.fn(),
}));

const makeDataQuery = (countryDimension = 'REF_AREA') =>
  ({
    urn: 'urn:test',
    metadata: { countryDimension, indicatorDimensions: [] },
  }) as any;

const makeStructures = () => ({}) as any;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getDimensions).mockReturnValue({ dimensions: [] } as any);
  jest.mocked(getLocalizedName).mockReturnValue(undefined);
  jest.mocked(getTimePeriods).mockReturnValue([]);
  jest
    .mocked(sortPeriods)
    .mockImplementation((a: string, b: string) => a.localeCompare(b));
  jest.mocked(isMonthly).mockReturnValue(false);
  jest.mocked(isQuarterly).mockReturnValue(false);
  jest.mocked(isYearly).mockReturnValue(false);
  jest.mocked(getRowsData).mockReturnValue([]);
  jest.mocked(buildChartConfig).mockReturnValue({ marker: 'config' } as any);
  jest
    .mocked(getDimensionsUniquenessByValues)
    .mockReturnValue({ nonUniqDimensions: [], uniqDimensions: [] } as any);
  jest.mocked(buildSerieKeyTitle).mockReturnValue('');
  jest.mocked(buildSortedNonRegionDimensionsList).mockReturnValue([]);
  jest.mocked(splitForUnits).mockReturnValue([]);
  jest
    .mocked(getDimRelatedStructures)
    .mockReturnValue({ concept: null, codeList: null } as any);
});

describe('buildChartData', () => {
  it('orchestrates row fetching, time-period sorting and unit splitting', () => {
    const structures = makeStructures();
    const data = { dataSets: [] } as any;
    const dataQuery = makeDataQuery();
    const rows = [{ REF_AREA: 'US' }] as any[];
    const sortedTimePeriods = ['2020', '2021'];
    const unitRows = { rows };

    jest.mocked(getRowsData).mockReturnValue(rows);
    jest.mocked(getTimePeriods).mockReturnValue(['2021', '2020']);
    jest
      .mocked(buildSortedNonRegionDimensionsList)
      .mockReturnValue(['FREQ', 'INDICATOR']);
    jest.mocked(getDimensionsUniquenessByValues).mockReturnValue({
      nonUniqDimensions: ['INDICATOR'],
      uniqDimensions: ['FREQ'],
    } as any);
    jest.mocked(splitForUnits).mockReturnValue([unitRows]);

    const result = buildChartData(structures, data, dataQuery, 'en');

    expect(getRowsData).toHaveBeenCalledWith(
      data,
      structures,
      dataQuery,
      'en',
      undefined,
      { includeChartData: false },
    );
    expect(buildSortedNonRegionDimensionsList).toHaveBeenCalledWith(
      structures,
      dataQuery,
    );
    expect(getDimensionsUniquenessByValues).toHaveBeenCalledWith(
      ['FREQ', 'INDICATOR'],
      rows,
    );
    expect(splitForUnits).toHaveBeenCalledWith(rows, ['INDICATOR'], structures);
    expect(result.units).toHaveLength(1);
    expect(result.units[0].rows).toBe(rows);
    expect(buildChartConfig).toHaveBeenCalledWith(
      sortedTimePeriods,
      expect.any(Array),
      undefined,
    );
  });
});

describe('createChartDataResolver', () => {
  it('defers building chart data until invoked', () => {
    const resolver = createChartDataResolver(
      makeStructures(),
      {} as any,
      makeDataQuery(),
      'en',
    );

    expect(getRowsData).not.toHaveBeenCalled();

    resolver();

    expect(getRowsData).toHaveBeenCalledTimes(1);
  });

  it('caches the result across subsequent calls', () => {
    const resolver = createChartDataResolver(
      makeStructures(),
      {} as any,
      makeDataQuery(),
      'en',
    );

    const first = resolver();
    const second = resolver();

    expect(first).toBe(second);
    expect(getRowsData).toHaveBeenCalledTimes(1);
  });
});

describe('buildSingleLineUnit', () => {
  it('builds a unit containing the single row', () => {
    const row = { REF_AREA: 'US' } as any;

    const unit = buildSingleLineUnit(
      row,
      ['2020'],
      makeStructures(),
      makeDataQuery(),
      'en',
    );

    expect(unit.rows).toEqual([row]);
    expect(unit.limitedByRowsAmountTo).toBeUndefined();
  });
});

describe('buildUnit', () => {
  it('builds dimension info using localized name and dimension id fallback', () => {
    jest.mocked(getDimensions).mockReturnValue({
      dimensions: [{ id: 'INDICATOR' }, { id: 'UNIT' }],
    } as any);
    jest
      .mocked(getLocalizedName)
      .mockReturnValueOnce('Indicator')
      .mockReturnValueOnce(undefined);
    jest
      .mocked(buildSerieKeyTitle)
      .mockReturnValueOnce('GDP')
      .mockReturnValueOnce('USD');

    const unit = buildUnit(
      { rows: [{ INDICATOR: 'GDP', UNIT: 'USD' } as any] },
      makeStructures(),
      makeDataQuery(),
      ['2020'],
      'en',
    );

    expect(unit.dimensions).toEqual([
      { id: 'INDICATOR', title: 'Indicator', value: 'GDP' },
      { id: 'UNIT', title: 'UNIT', value: 'USD' },
    ]);
  });

  it('excludes the country dimension from sidebar info', () => {
    jest.mocked(getDimensions).mockReturnValue({
      dimensions: [{ id: 'REF_AREA' }, { id: 'INDICATOR' }],
    } as any);
    jest.mocked(getLocalizedName).mockReturnValue('Indicator');
    jest.mocked(buildSerieKeyTitle).mockReturnValue('GDP');

    const unit = buildUnit(
      { rows: [{ REF_AREA: 'US', INDICATOR: 'GDP' } as any] },
      makeStructures(),
      makeDataQuery('REF_AREA'),
      ['2020'],
      'en',
    );

    expect(unit.dimensions.map((d) => d.id)).toEqual(['INDICATOR']);
  });

  it('skips dimensions with null id', () => {
    jest.mocked(getDimensions).mockReturnValue({
      dimensions: [{ id: null }, { id: 'INDICATOR' }],
    } as any);
    jest.mocked(getLocalizedName).mockReturnValue('Indicator');

    const unit = buildUnit(
      { rows: [{ INDICATOR: 'GDP' } as any] },
      makeStructures(),
      makeDataQuery(),
      ['2020'],
      'en',
    );

    expect(unit.dimensions).toHaveLength(1);
    expect(unit.dimensions[0].id).toBe('INDICATOR');
  });

  it('limits rows to MAX_LINES_PER_UNIT and reports the limit', () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ id: i }) as any);

    const unit = buildUnit(
      { rows },
      makeStructures(),
      makeDataQuery(),
      ['2020'],
      'en',
    );

    expect(unit.rows).toBe(rows);
    expect(unit.limitedByRowsAmountTo).toBe(10);
    const seriesArg = jest.mocked(buildChartConfig).mock.calls[0][1];
    expect(seriesArg).toHaveLength(10);
  });

  it('does not report a limit when rows are within MAX_LINES_PER_UNIT', () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ id: i }) as any);

    const unit = buildUnit(
      { rows },
      makeStructures(),
      makeDataQuery(),
      ['2020'],
      'en',
    );

    expect(unit.limitedByRowsAmountTo).toBeUndefined();
    const seriesArg = jest.mocked(buildChartConfig).mock.calls[0][1];
    expect(seriesArg).toHaveLength(3);
  });

  it('uses empty series name when dataQuery has no country dimension', () => {
    const dataQuery = { urn: 'urn:1', metadata: {} } as any;

    buildUnit(
      { rows: [{} as any] },
      makeStructures(),
      dataQuery,
      ['2020'],
      'en',
    );

    const seriesArg = jest.mocked(buildChartConfig).mock.calls[0][1];
    expect(seriesArg[0]).toMatchObject({ name: '', type: 'line' });
  });

  it('builds series name from the country dimension title', () => {
    jest.mocked(buildSerieKeyTitle).mockReturnValue('United States');

    buildUnit(
      { rows: [{ REF_AREA: 'US' } as any] },
      makeStructures(),
      makeDataQuery('REF_AREA'),
      ['2020'],
      'en',
    );

    const seriesArg = jest.mocked(buildChartConfig).mock.calls[0][1];
    expect(seriesArg[0].name).toBe('United States');
  });

  it('extracts time-period values from the row into series data', () => {
    const row = {
      '2020': { value: [{ value: 100 }] },
      '2021': { value: [{ value: 200 }] },
      '2022': { value: [{ value: 0 }] },
    } as any;

    buildUnit(
      { rows: [row] },
      makeStructures(),
      makeDataQuery(),
      ['2020', '2021', '2022', '2023'],
      'en',
    );

    const seriesArg = jest.mocked(buildChartConfig).mock.calls[0][1];
    expect(seriesArg[0].data).toEqual([100, 200, null, null]);
  });

  it('filters monthly time periods when frequency dimension is MONTHLY', () => {
    jest.mocked(getDimensions).mockReturnValue({
      dimensions: [{ id: 'FREQ' }],
    } as any);
    jest.mocked(buildSerieKeyTitle).mockReturnValue('M');
    jest.mocked(isMonthly).mockImplementation((p: string) => p.includes('-'));

    buildUnit(
      { rows: [{ FREQ: 'M' } as any] },
      makeStructures(),
      makeDataQuery(),
      ['2020', '2020-01', '2020-02'],
      'en',
    );

    expect(buildChartConfig).toHaveBeenCalledWith(
      ['2020-01', '2020-02'],
      expect.any(Array),
      undefined,
    );
  });

  it('filters quarterly time periods when frequency dimension is QUARTERLY', () => {
    jest.mocked(getDimensions).mockReturnValue({
      dimensions: [{ id: 'FREQ' }],
    } as any);
    jest.mocked(buildSerieKeyTitle).mockReturnValue('Q');
    jest
      .mocked(isQuarterly)
      .mockImplementation((p: string) => p.includes('-Q'));

    buildUnit(
      { rows: [{ FREQ: 'Q' } as any] },
      makeStructures(),
      makeDataQuery(),
      ['2020', '2020-Q1'],
      'en',
    );

    expect(buildChartConfig).toHaveBeenCalledWith(
      ['2020-Q1'],
      expect.any(Array),
      undefined,
    );
  });

  it('filters annual time periods when frequency dimension is ANNUAL', () => {
    jest.mocked(getDimensions).mockReturnValue({
      dimensions: [{ id: 'FREQ' }],
    } as any);
    jest.mocked(buildSerieKeyTitle).mockReturnValue('A');
    jest.mocked(isYearly).mockImplementation((p: string) => !p.includes('-'));

    buildUnit(
      { rows: [{ FREQ: 'A' } as any] },
      makeStructures(),
      makeDataQuery(),
      ['2020', '2020-Q1', '2021'],
      'en',
    );

    expect(buildChartConfig).toHaveBeenCalledWith(
      ['2020', '2021'],
      expect.any(Array),
      undefined,
    );
  });

  it('passes time periods through unchanged when frequency dimension is missing', () => {
    jest.mocked(getDimensions).mockReturnValue({ dimensions: [] } as any);

    buildUnit(
      { rows: [{} as any] },
      makeStructures(),
      makeDataQuery(),
      ['2020', '2021'],
      'en',
    );

    expect(buildChartConfig).toHaveBeenCalledWith(
      ['2020', '2021'],
      expect.any(Array),
      undefined,
    );
  });

  it('forwards chart styles to buildChartConfig', () => {
    const styles = { colors: ['#000'] } as any;

    buildUnit(
      { rows: [{} as any] },
      makeStructures(),
      makeDataQuery(),
      ['2020'],
      'en',
      styles,
    );

    expect(buildChartConfig).toHaveBeenCalledWith(
      ['2020'],
      expect.any(Array),
      styles,
    );
  });
});
