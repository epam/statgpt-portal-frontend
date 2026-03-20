import { getCrossDsDimensionsColumns } from './dimensions-columns';
import {
  DatasetDimensionsScheme,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { ColDef } from 'ag-grid-community';
import { ConversationViewTitles } from '../../../models/titles';

export function buildCrossDatasetGridColumns(
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  locale: string,
  titles?: ConversationViewTitles,
): ColDef[] {
  const dimColumns = getCrossDsDimensionsColumns(
    structuresMap,
    datasetDimensionsSchemesMap,
    locale,
    titles,
  );
  return dimColumns;
}
