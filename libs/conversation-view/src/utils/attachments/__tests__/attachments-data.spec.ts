import { getStructureDataMaps } from '../attachments-data';

const mockGetDimensions = jest.fn();
const mockGetStructureDimensions = jest.fn();
const mockGetTimeSeriesFilterKey = jest.fn();

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getDimensions: (...args: any[]) => mockGetDimensions(...args),
  getFiltersDtoMapFromDataQuery: jest.fn(() => new Map()),
  getQueryTimePeriodFilters: jest.fn(() => null),
  getStructureDimensions: (...args: any[]) =>
    mockGetStructureDimensions(...args),
  getTimeRangeFromAttachment: jest.fn(() => null),
  getTimeSeriesFilterKey: (...args: any[]) =>
    mockGetTimeSeriesFilterKey(...args),
}));

describe('getStructureDataMaps', () => {
  beforeEach(() => {
    mockGetDimensions.mockReset();
    mockGetStructureDimensions.mockReset();
    mockGetTimeSeriesFilterKey.mockReset();
    mockGetDimensions.mockReturnValue({
      dimensions: [{ id: 'FREQ' }],
      timeDimensions: [],
    });
    mockGetStructureDimensions.mockReturnValue([{ id: 'FREQ' }]);
    mockGetTimeSeriesFilterKey.mockReturnValue('ORIGINAL');
  });

  it('loads dataset metadata before dataset data and uses resolved filter params when provided', async () => {
    const dataQuery = {
      urn: 'AGENCY:DF_A(1.0)',
      filters: [{ componentCode: 'FREQ', operator: 'in', values: ['D'] }],
    } as any;
    const getDataSet = jest.fn().mockResolvedValue({
      data: {
        dataflows: [{ id: 'DF_A' }],
      },
    });
    const getDataSetData = jest.fn().mockResolvedValue({ dataSets: [] });
    const setIsLoadingGridData = jest.fn();
    const getFilterParamsMap = jest.fn(() => {
      return new Map([
        [
          dataQuery.urn,
          {
            filterKey: 'D+M',
            timeFilter: 'TIME',
          },
        ],
      ]);
    });

    await getStructureDataMaps(
      [dataQuery],
      getDataSet,
      getDataSetData,
      setIsLoadingGridData,
      getFilterParamsMap,
    );

    expect(getFilterParamsMap).toHaveBeenCalledWith(
      expect.objectContaining({
        structuresMap: expect.any(Map),
        dimensionsMap: expect.any(Map),
      }),
    );
    expect(getDataSetData).toHaveBeenCalledWith(dataQuery.urn, {
      filterKey: 'D+M',
      timeFilter: 'TIME',
    });
  });

  it('falls back to attachment filters when no resolved filter params are provided', async () => {
    const dataQuery = {
      urn: 'AGENCY:DF_A(1.0)',
      filters: [{ componentCode: 'FREQ', operator: 'in', values: ['D'] }],
    } as any;
    const getDataSet = jest.fn().mockResolvedValue({
      data: {
        dataflows: [{ id: 'DF_A' }],
      },
    });
    const getDataSetData = jest.fn().mockResolvedValue({ dataSets: [] });

    await getStructureDataMaps(
      [dataQuery],
      getDataSet,
      getDataSetData,
      jest.fn(),
    );

    expect(mockGetTimeSeriesFilterKey).toHaveBeenCalledWith(
      [{ id: 'FREQ' }],
      dataQuery.filters,
    );
    expect(getDataSetData).toHaveBeenCalledWith(dataQuery.urn, {
      filterKey: 'ORIGINAL',
      timeFilter: null,
    });
  });
});
