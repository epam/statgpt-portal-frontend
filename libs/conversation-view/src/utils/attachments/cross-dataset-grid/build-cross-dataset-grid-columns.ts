import { getCrossDsDimensionsColumns } from './dimensions-columns';
import {
  DatasetDimensionsScheme,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { ColDef } from 'ag-grid-community';

export function buildCrossDatasetGridColumns(
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  locale: string,
): ColDef[] {
  const dimColumns = getCrossDsDimensionsColumns(
    structuresMap,
    datasetDimensionsSchemesMap,
    locale,
  );
  return dimColumns;
}
