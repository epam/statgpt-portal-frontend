import { getCrossDatasetInfoColumns } from './dataset-info-columns';
import { getCrossDatasetDimensionsColumns } from './dimensions-columns';
import { getCrossDatasetTimeseriesColumns } from './timeseries-columns';
import {
  DataMessage,
  DatasetDimensionsScheme,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import { ColDef } from 'ag-grid-community';
import { ConversationViewTitles } from '../../../models/titles';
import { getChartColumn } from '../../../constants/grid';
import { CELL_PADDING_0, METADATA_CELL_RENDER } from '../../../constants/grid';

function getCrossDatasetMetadataColumn(
  structuresMap: Map<string, StructuralData | undefined>,
  locale: string,
  titles?: ConversationViewTitles,
): ColDef {
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
    cellRendererParams: { structuresMap, locale, titles },
  };
}

export function buildCrossDatasetGridColumns(
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  dataMessagesMap: Map<string, DataMessage | null>,
  locale: string,
  titles?: ConversationViewTitles,
  formattingSettings?: FormatNumbersType,
): ColDef[] {
  const datasetInfoColumns = getCrossDatasetInfoColumns(
    structuresMap,
    locale,
    titles,
  );
  const dimColumns = getCrossDatasetDimensionsColumns(
    structuresMap,
    datasetDimensionsSchemesMap,
    locale,
    titles,
  );
  const timeColumns = getCrossDatasetTimeseriesColumns(
    dataMessagesMap,
    structuresMap,
    locale,
    formattingSettings,
    titles,
  );

  return [
    getCrossDatasetMetadataColumn(structuresMap, locale, titles),
    ...datasetInfoColumns,
    ...dimColumns,
    ...timeColumns,
    getChartColumn(void 0, void 0, locale, void 0, titles),
  ];
}
