import {
  DataMessage,
  getLocalizedName,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { ChartingData } from '../../../models/charting';
import { ChartingStyles } from '../../../models/attachments-styles';
import { buildChartData } from './chart-data';

export function createCrossDatasetChartingDataResolver(
  structuresMap: Map<string, StructuralData | undefined>,
  dataMessagesMap: Map<string, DataMessage | null>,
  dataQueries: DataQuery[],
  locale: string,
  chartStyles?: ChartingStyles,
): () => ChartingData {
  let cachedChartingData: ChartingData | undefined;

  return () => {
    cachedChartingData ??= buildCrossDatasetChartingData(
      structuresMap,
      dataMessagesMap,
      dataQueries,
      locale,
      chartStyles,
    );

    return cachedChartingData;
  };
}

export function buildCrossDatasetChartingData(
  structuresMap: Map<string, StructuralData | undefined>,
  dataMessagesMap: Map<string, DataMessage | null>,
  dataQueries: DataQuery[],
  locale: string,
  chartStyles?: ChartingStyles,
): ChartingData {
  const groups = dataQueries
    .filter((q) => !q.disabled)
    .flatMap((dataQuery) => {
      const structures = structuresMap.get(dataQuery.urn);
      const dataMessage = dataMessagesMap.get(dataQuery.urn);

      if (!structures || !dataMessage) {
        return [];
      }

      const datasetName = getLocalizedName(structures.dataflows?.[0], locale);

      return [
        {
          title: datasetName,
          units: buildChartData(
            structures,
            dataMessage,
            dataQuery,
            locale,
            chartStyles,
          ).units,
        },
      ];
    });

  return {
    units: groups.flatMap((group) => group.units),
    groups,
  };
}
