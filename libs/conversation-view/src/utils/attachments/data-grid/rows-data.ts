import { DataMessage } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { getParsedResponse } from '@statgpt/sdmx-toolkit/src/parsers/request-parser/data-response-parser';
import { getConvertedData } from './get-converted-data';
import { TimeSeries } from '@statgpt/sdmx-toolkit/src/models/data/time-series';
import { GridData } from '../../../types/data-grid/grid-data';
import {
  getDimensions,
  getTimePeriods,
} from '@statgpt/sdmx-toolkit/src/utils/get-dimensions';
import { sortPeriods } from '@statgpt/sdmx-toolkit/src/parsers/time-period-parser/period-sorting';
import { buildSingleLineUnit } from '../charting/chart-data';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { ChartingStyles } from '../../../models/attachments-styles';
import { CHART_COLUMN_ID } from '../../../constants/grid';

export function getRowsData(
  data: DataMessage,
  structures: StructuralData,
  dataQuery: DataQuery | undefined,
  locale: string,
  chartStyles?: ChartingStyles,
): GridData[] {
  const timeSeries: TimeSeries[] = data == null ? [] : getParsedResponse(data);
  const dimensions = getDimensions(structures)?.dimensions || [];
  const timeDimensions = getDimensions(structures)?.timeDimensions || [];
  const rows = getConvertedData(timeSeries, dimensions, timeDimensions);
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
      [CHART_COLUMN_ID]: buildSingleLineUnit(
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
