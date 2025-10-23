import { ColDef, ITooltipParams } from 'ag-grid-community';
import {
  GridAttachmentContent,
  RowData,
  SchemaField,
} from '@epam/statgpt-dial-toolkit';
import {
  DEFAULT_GRID_COLUMN_WITH,
  GRID_COLUMN_FLEX,
} from '../../constants/grid';

const SPECIAL_COLUMNS = ['index', 'value'];
export const convertToGridData = (
  visualizerData: GridAttachmentContent,
): { data: RowData[]; columns: ColDef[] } => {
  return {
    columns: getColumns(visualizerData),
    data: getRowData(visualizerData),
  };
};

const getRowData = (visualizerData: GridAttachmentContent): RowData[] => {
  const timeColumn = visualizerData.metadata.time_column;
  const data: Record<string, RowData> = {};

  for (const row of visualizerData.data.data) {
    const { value, ...res } = row;
    const key = getKey(row, timeColumn);

    data[key] = {
      ...(data[key] || {}),
      ...res,
      [row[timeColumn] as string]: value,
    } as RowData;
  }

  return Object.values(data);
};

const getKey = (row: RowData, timeColumn: string) => {
  return Object.keys(row)
    .filter((key) => !SPECIAL_COLUMNS.includes(key) && key !== timeColumn)
    .map((key) => row[key])
    .join('.');
};

const getColumns = (visualizerData: GridAttachmentContent): ColDef[] => {
  const { metadata, data } = visualizerData;
  const timeColumn = metadata.time_column;
  const pinned_columns = metadata.pinned_columns || [];
  const fields = data.schema.fields;
  const columns: ColDef[] = [];

  const timeKeys = data.data.map((row) => row[timeColumn] as string);
  const uniqTimeKeys = Array.from(new Set(timeKeys)).filter((f) => f != null);
  const timeColumns = uniqTimeKeys.map(
    (time) =>
      ({
        field: time,
        colId: time,
        headerName: time,
        cellClass: 'text-right',
        width: DEFAULT_GRID_COLUMN_WITH,
      }) as ColDef,
  );

  const pinnedColumns = pinned_columns
    .map((f) => fields.find((field) => field.name === f) as SchemaField)
    .filter((f) => f != null);

  const notPinnedColumns = fields
    .filter((f) => !pinned_columns.includes(f.name))
    .filter((f) => f != null);

  if (pinnedColumns.length > 0) {
    for (const field of [...pinnedColumns]) {
      if (field.name === timeColumn || SPECIAL_COLUMNS.includes(field.name)) {
        continue;
      }

      columns.push({
        colId: field.name,
        field: field.name,
        headerName: field.name,
        pinned: 'left',
        ...GRID_COLUMN_FLEX,
        tooltipValueGetter: (p: ITooltipParams) => p.value,
      });
    }
  }

  for (const field of [...notPinnedColumns]) {
    if (field.name === timeColumn || SPECIAL_COLUMNS.includes(field.name)) {
      continue;
    }

    columns.push({
      colId: field.name,
      field: field.name,
      headerName: field.name,
      pinned: false,
      ...GRID_COLUMN_FLEX,
      tooltipValueGetter: (p: ITooltipParams) => p.value,
    });
  }

  columns.push(...timeColumns);

  return columns;
};
