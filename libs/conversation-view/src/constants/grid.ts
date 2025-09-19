import { ColDef } from 'ag-grid-community';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { MetadataSettings } from '../models/metadata';
import { Data } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import ChartCellRenderer from '../components/Attachments/GridCellRenderers/ChartCellRenderer';
import { ConversationViewTitles } from '../models/titles';

export const GRID_HEADER_HEIGHT = 32;
export const GRID_ROW_HEIGHT = 32;
export const GRID_HORIZONTAL_SCROLL_GAP = 16;
export const CELL_PADDING_0 = 'padding-0';
export const DEFAULT_GRID_COLUMN_WITH = 200;
export const CHART_COLUMN_WIDTH = GRID_HEADER_HEIGHT;

export const OBSERVATION_VALUE_CELL_RENDER = 'observationValueCell';
export const METADATA_CELL_RENDER = 'metadataCell';
export const CHART_CELL_RENDER = 'chartCell';

export const CHART_COLUMN_ID = 'Chart_column';

export const getMetaDataColumn = (
  dataSetData?: StructuralData,
  data?: Data,
  locale?: string,
  metadataSettings?: MetadataSettings,
  titles?: ConversationViewTitles,
): ColDef => {
  return {
    headerName: '',
    suppressHeaderMenuButton: true,
    suppressNavigable: true,
    sortable: false,
    editable: false,
    pinned: true,
    width: 32,
    maxWidth: 32,
    cellClass: CELL_PADDING_0,
    cellRenderer: METADATA_CELL_RENDER,
    cellRendererParams: {
      attributesData: data,
      dataSetData,
      locale,
      metadataSettings,
      titles,
    },
  };
};

export function getChartColumn(
  dataSetData?: StructuralData,
  data?: Data,
  locale?: string,
  width = CHART_COLUMN_WIDTH,
  titles?: ConversationViewTitles,
): ColDef {
  return {
    headerName: '',
    field: CHART_COLUMN_ID,
    colId: CHART_COLUMN_ID,
    suppressHeaderMenuButton: true,
    suppressNavigable: true,
    sortable: false,
    editable: false,
    pinned: 'right',
    width: width,
    maxWidth: width,
    minWidth: width,
    cellClass: CELL_PADDING_0,
    suppressColumnsToolPanel: true,
    cellRenderer: ChartCellRenderer,
    cellRendererParams: {
      attributesData: data,
      dataSetData,
      locale,
      titles,
    },
  };
}
