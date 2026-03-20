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
    formattingSettings,
    titles,
  );
  return [...datasetInfoColumns, ...dimColumns, ...timeColumns];
}
