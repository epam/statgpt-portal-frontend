import {
  DataMessage,
  getDimensions,
  getParsedResponse,
  getTimePeriods,
  sortPeriods,
  StructuralData,
  TimeSeries,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

import { getConvertedData } from './get-converted-data';
import { GridData } from '../../../types/data-grid/grid-data';
import { buildSingleLineUnit } from '../charting/chart-data';
import { ChartingStyles } from '../../../models/attachments-styles';
import { CHART_COLUMN_ID } from '../../../constants/grid';

interface GetRowsDataOptions {
  includeChartData?: boolean;
}

export function getRowsData(
  data: DataMessage,
  structures: StructuralData,
  dataQuery: DataQuery | undefined,
  locale: string,
  chartStyles?: ChartingStyles,
  options: GetRowsDataOptions = {},
): GridData[] {
  const timeSeries: TimeSeries[] = data == null ? [] : getParsedResponse(data);
  const dimensions = getDimensions(structures)?.dimensions || [];
  const timeDimensions = getDimensions(structures)?.timeDimensions || [];
  const rows = getConvertedData(timeSeries, dimensions, timeDimensions);

  if (options.includeChartData === false) {
    return rows;
  }

  return extendDataWithChart(
    rows,
    data,
    structures,
    dataQuery,
    locale,
    chartStyles,
  );
}

function extendDataWithChart(
  rows: GridData[],
  data: DataMessage,
  structures: StructuralData,
  dataQuery: DataQuery | undefined,
  locale: string,
  chartStyles?: ChartingStyles,
): GridData[] {
  const timePeriods = getTimePeriods(data);
  const sortedTimePeriods = timePeriods.sort((a, b) => sortPeriods(a, b));
  return rows.map((row) => {
    return {
      ...row,
      [CHART_COLUMN_ID]: () =>
        buildSingleLineUnit(
          row,
          sortedTimePeriods,
          structures,
          dataQuery,
          locale,
          chartStyles,
        ),
    };
  });
}
