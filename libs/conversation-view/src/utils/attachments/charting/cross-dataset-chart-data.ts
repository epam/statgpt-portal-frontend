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

/**
 * Builds `ChartingData` for a cross-dataset chart from parsed SDMX structures
 * and data messages, producing one chart group per dataset.
 *
 * All map params are keyed by dataset URN; `dataQueries` selects which datasets
 * to include and in what order.
 *
 * @param structuresMap - Parsed structure metadata per dataset URN.
 * @param dataMessagesMap - Raw SDMX-JSON data message per dataset URN.
 * @param dataQueries - Datasets to render, in order; matched to the maps by `urn`.
 * @param locale - Locale used to resolve localized names.
 * @param chartStyles - Optional chart styling.
 * @returns Charting data for `CustomChartAttachment`.
 */
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
