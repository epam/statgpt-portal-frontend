import { getLocalizedName } from '@epam/statgpt-sdmx-toolkit';
import { buildChartData } from '../chart-data';
import {
  buildCrossDatasetChartingData,
  createCrossDatasetChartingDataResolver,
} from '../cross-dataset-chart-data';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getLocalizedName: jest.fn(),
}));

jest.mock('../chart-data', () => ({
  buildChartData: jest.fn(),
}));

describe('cross-dataset chart data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds chart groups for datasets with structures and data messages', () => {
    const structures = { dataflows: [{ id: 'flow-1' }] };
    const dataMessage = {};
    const dataQuery = { urn: 'urn:1' };
    const structuresMap = new Map([['urn:1', structures]]);
    const dataMessagesMap = new Map([['urn:1', dataMessage]]);
    const chartUnit = {
      config: {},
      dimensions: [],
      rows: [],
      limitedByRowsAmountTo: undefined,
      isPlottable: false,
    };

    jest.mocked(getLocalizedName).mockReturnValue('Dataset 1');
    jest.mocked(buildChartData).mockReturnValue({ units: [chartUnit] });

    expect(
      buildCrossDatasetChartingData(
        structuresMap,
        dataMessagesMap,
        [dataQuery],
        'en',
      ),
    ).toEqual({
      units: [chartUnit],
      groups: [{ title: 'Dataset 1', units: [chartUnit] }],
    });
  });

  it('does not build charts until the resolver is called and caches the result', () => {
    const structures = { dataflows: [{ id: 'flow-1' }] };
    const dataMessage = {};
    const dataQuery = { urn: 'urn:1' };
    const structuresMap = new Map([['urn:1', structures]]);
    const dataMessagesMap = new Map([['urn:1', dataMessage]]);
    const chartUnit = {
      config: {},
      dimensions: [],
      rows: [],
      limitedByRowsAmountTo: undefined,
      isPlottable: false,
    };

    jest.mocked(getLocalizedName).mockReturnValue('Dataset 1');
    jest.mocked(buildChartData).mockReturnValue({ units: [chartUnit] });

    const getChartingData = createCrossDatasetChartingDataResolver(
      structuresMap,
      dataMessagesMap,
      [dataQuery],
      'en',
    );

    expect(buildChartData).not.toHaveBeenCalled();

    const firstResult = getChartingData();
    const secondResult = getChartingData();

    expect(firstResult).toBe(secondResult);
    expect(buildChartData).toHaveBeenCalledTimes(1);
  });
});
