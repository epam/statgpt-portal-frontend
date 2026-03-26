import {
  DataMessage,
  getTimePeriods,
  sortPeriods,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import {
  defaultFormatNumbers,
  formatNumberBySign,
  FormatNumbersType,
} from '@epam/statgpt-shared-toolkit';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import {
  CELL_PADDING_0,
  DEFAULT_GRID_COLUMN_WITH,
  OBSERVATION_VALUE_CELL_RENDER,
} from '../../../constants/grid';
import { localizeTimePeriod } from '../time-period';
import { ConversationViewTitles } from '../../../models/titles';

export function getCrossDatasetTimeseriesColumns(
  dataMessagesMap: Map<string, DataMessage | null>,
  structuresMap: Map<string, StructuralData | undefined>,
  locale: string,
  formattingSettings?: FormatNumbersType,
  titles?: ConversationViewTitles,
): ColDef[] {
  const timePeriods = collectTimePeriods(dataMessagesMap);
  const sortedPeriods = timePeriods.sort((a, b) => sortPeriods(a, b));

  return sortedPeriods.map((period) => {
    const obsCol = getObservationColumn(period, formattingSettings, titles);
    return {
      ...obsCol,
      valueGetter: (params) =>
        params.data[params.column.getColId()]?.value?.[0]?.value || null,
      cellClass: CELL_PADDING_0,
      cellRenderer: OBSERVATION_VALUE_CELL_RENDER,
      width: DEFAULT_GRID_COLUMN_WITH,
      cellRendererParams: {
        structuresMap,
        locale,
        titles,
      },
    };
  });
}

function collectTimePeriods(
  dataMessagesMap: Map<string, DataMessage | null>,
): string[] {
  const periodsSet = new Set<string>();
  dataMessagesMap.forEach((dataMessage) => {
    if (dataMessage == null) {
      return;
    }
    const periods = getTimePeriods(dataMessage);
    periods.forEach((period) => periodsSet.add(period));
  });
  return Array.from(periodsSet);
}

function getObservationColumn(
  period: string,
  formattingSettings = defaultFormatNumbers,
  titles?: ConversationViewTitles,
): ColDef {
  return {
    headerName: localizeTimePeriod(period, titles),
    colId: period,
    field: period,
    type: 'numericColumn',
    suppressColumnsToolPanel: true,
    sortable: false,
    width: DEFAULT_GRID_COLUMN_WITH,
    cellClass: ['justify-end', 'cell-with-meta'],
    valueFormatter: (params: ValueFormatterParams) =>
      formatNumberBySign(params.value, formattingSettings),
  };
}
