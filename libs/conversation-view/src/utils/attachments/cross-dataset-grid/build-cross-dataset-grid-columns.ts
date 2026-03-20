import { getCrossDsDatasetInfoColumns } from './dataset-info-columns';
import { getCrossDsDimensionsColumns } from './dimensions-columns';
import { getCrossDsTimeseriesColumns } from './timeseries-columns';
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
  const datasetInfoColumns = getCrossDsDatasetInfoColumns(
    structuresMap,
    locale,
    titles,
  );
  const dimColumns = getCrossDsDimensionsColumns(
    structuresMap,
    datasetDimensionsSchemesMap,
    locale,
    titles,
  );
  const timeColumns = getCrossDsTimeseriesColumns(
    dataMessagesMap,
    formattingSettings,
    titles,
  );
  return [...datasetInfoColumns, ...dimColumns, ...timeColumns];
}
