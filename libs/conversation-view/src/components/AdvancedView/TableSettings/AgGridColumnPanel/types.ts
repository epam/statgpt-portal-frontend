import type { ColDef, GridApi } from 'ag-grid-community';

export type ColumnPanelFilterParams = {
  colId: string;
  label: string;
  colDef: ColDef;
};

export type ColumnPanelFilter = (params: ColumnPanelFilterParams) => boolean;

export type AgGridInitialColumnsState = {
  columnState: ReturnType<GridApi['getColumnState']>;
  columnGroupState: ReturnType<GridApi['getColumnGroupState']>;
};
