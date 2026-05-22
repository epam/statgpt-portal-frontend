import { GridData } from '../../../types/data-grid/grid-data';
import { getRowsData } from '../data-grid/rows-data';
import {
  DataMessage,
  getLocalizedName,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { ChartingStyles } from '@epam/statgpt-conversation-view';

export function buildCrossDatasetGridData(
  structuresMap: Map<string, StructuralData | undefined>,
  dataMessagesMap: Map<string, DataMessage | null>,
  dataQueries: DataQuery[],
  locale: string,
  chartStyles?: ChartingStyles,
): GridData[] {
  const rows: GridData[] = [];
  dataQueries.filter((q) => !q.disabled).forEach((dataQuery) => {
    const urn = dataQuery.urn;
    const dataMessage = dataMessagesMap.get(urn);
    const structures = structuresMap.get(urn);
    if (dataMessage == null || structures == null) {
      return;
    }
    const dsRows = getRowsData(
      dataMessage,
      structures,
      dataQuery,
      locale,
      chartStyles,
    );
    const datasetTitle = getLocalizedName(structures.dataflows?.[0], locale);
    rows.push(
      ...dsRows.map((row) => ({
        ...row,
        dataset: {
          urn: urn,
        },
        datasetTitle,
      })),
    );
  });
  return rows;
}
