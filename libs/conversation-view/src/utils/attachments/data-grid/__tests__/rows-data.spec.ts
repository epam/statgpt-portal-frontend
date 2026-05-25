import {
  getDimensions,
  getParsedResponse,
  getTimePeriods,
  sortPeriods,
} from '@epam/statgpt-sdmx-toolkit';
import { CHART_COLUMN_ID } from '../../../../constants/grid';
import { buildSingleLineUnit } from '../../charting/chart-data';
import { getConvertedData } from '../get-converted-data';
import { getRowsData } from '../rows-data';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getDimensions: jest.fn(),
  getParsedResponse: jest.fn(),
  getTimePeriods: jest.fn(),
  sortPeriods: jest.fn(),
}));

jest.mock('../get-converted-data', () => ({
  getConvertedData: jest.fn(),
}));

jest.mock('../../charting/chart-data', () => ({
  buildSingleLineUnit: jest.fn(),
}));

describe('getRowsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds single-line chart data only when the chart cell value is resolved', () => {
    const data = {};
    const structures = {};
    const dataQuery = { urn: 'test-urn' };
    const chartStyles = {};
    const timeSeries = [{ name: 'A.US' }];
    const rows = [{ FREQ: 'A', REF_AREA: 'US' }];
    const chartUnit = {
      config: {},
      dimensions: [],
      rows,
      limitedByRowsAmountTo: undefined,
      isPlottable: false,
    };

    jest.mocked(getParsedResponse).mockReturnValue(timeSeries);
    jest.mocked(getDimensions).mockReturnValue({
      dimensions: [{ id: 'FREQ' }, { id: 'REF_AREA' }],
      timeDimensions: [{ id: 'TIME_PERIOD' }],
    });
    jest.mocked(getConvertedData).mockReturnValue(rows);
    jest.mocked(getTimePeriods).mockReturnValue(['2021', '2020']);
    jest.mocked(sortPeriods).mockImplementation((a, b) => a.localeCompare(b));
    jest.mocked(buildSingleLineUnit).mockReturnValue(chartUnit);

    const result = getRowsData(data, structures, dataQuery, 'en', chartStyles);

    expect(buildSingleLineUnit).not.toHaveBeenCalled();

    const chartCellValue = result[0][CHART_COLUMN_ID];
    expect(typeof chartCellValue).toBe('function');
    expect((chartCellValue as () => unknown)()).toBe(chartUnit);
    expect(buildSingleLineUnit).toHaveBeenCalledWith(
      rows[0],
      ['2020', '2021'],
      structures,
      dataQuery,
      'en',
      chartStyles,
    );
  });
});
