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
import {
  getChartColumn,
  getCrossDatasetMetadataColumn,
} from '../../../constants/grid';

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
