import { ColDef } from 'ag-grid-community';

export type ObsColGetter = (colId: string, colName?: string) => ColDef;
