import { ColDef } from 'ag-grid-community';
import {
  DataConstraints,
  DataMessage,
  DatasetDimensionsScheme,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  FormatNumbersType,
  TimeRange,
} from '@epam/statgpt-shared-toolkit';
import { MetadataSettings } from '../../../models/metadata';
import { CrossDatasetGridAttachmentType } from '../../../models/attachments';
import { GridData } from '../../../types/data-grid/grid-data';
import { buildCrossDatasetGridColumns } from './build-cross-dataset-grid-columns';
import { buildCrossDatasetGridData } from './build-cross-dataset-grid-data';
import { ChartingStyles } from '../../../models/attachments-styles';
import { ConversationViewTitles } from '../../../models/titles';
import { CrossDatasetGridViewMode } from '../../../components/AdvancedView/TableSettings/types';

export function buildCrossDatasetGridAttachment(
  structuresMap: Map<string, StructuralData | undefined>,
  dataMessageMap: Map<string, DataMessage | null>,
  datasetDimensionsSchemeMap: Map<string, DatasetDimensionsScheme | undefined>,
  dataQueries: DataQuery[],
  locale: string,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  chartStyles?: ChartingStyles,
  titles?: ConversationViewTitles,
  constraintsMap?: Map<string, DataConstraints[] | undefined>,
  selectedTimePeriod?: TimeRange,
  gridViewMode: CrossDatasetGridViewMode = CrossDatasetGridViewMode.Compact,
): Partial<CrossDatasetGridAttachmentType> {
  const gridContent = buildCrossDatasetGridContent(
    structuresMap,
    dataMessageMap,
    datasetDimensionsSchemeMap,
    dataQueries,
    locale,
    formattingSettings,
    metadataSettings,
    chartStyles,
    titles,
    constraintsMap,
    selectedTimePeriod,
    gridViewMode,
  );

  return {
    title: titles?.dataGrid || 'Data',
    gridContent,
  };
}

/**
 * Builds the `{ data, columns }` grid content for a cross-dataset grid from
 * parsed SDMX structures and data messages.
 *
 * All map params are keyed by dataset URN; `dataQueries` selects which datasets
 * to include and in what order. Entries with no matching structure or data
 * message are skipped.
 *
 * @param structuresMap - Parsed structure metadata per dataset URN.
 * @param dataMessagesMap - Raw SDMX-JSON data message per dataset URN.
 * @param datasetDimensionsSchemesMap - Dimension-role scheme per URN; drives dimension column grouping (`undefined` entries fall back to degraded labelling).
 * @param dataQueries - Datasets to render, in order; matched to the maps by `urn`.
 * @param locale - Locale used to resolve localized names.
 * @param formattingSettings - Optional number formatting for observation values.
 * @param chartStyles - Optional styling for the sparkline chart column.
 * @param titles - Optional column header label overrides.
 * @param gridViewMode - Dimension display mode; defaults to compact.
 * @returns AG Grid `columns` and row `data` for `CrossDatasetGridAttachment`.
 */
export function buildCrossDatasetGridContent(
  structuresMap: Map<string, StructuralData | undefined>,
  dataMessagesMap: Map<string, DataMessage | null>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  dataQueries: DataQuery[],
  locale: string,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  chartStyles?: ChartingStyles,
  titles?: ConversationViewTitles,
  _constraintsMap?: Map<string, DataConstraints[] | undefined>,
  _selectedTimePeriod?: TimeRange,
  gridViewMode: CrossDatasetGridViewMode = CrossDatasetGridViewMode.Compact,
): { data: GridData[]; columns: ColDef[] } {
  return {
    columns: buildCrossDatasetGridColumns(
      structuresMap,
      datasetDimensionsSchemesMap,
      dataMessagesMap,
      locale,
      titles,
      formattingSettings,
      gridViewMode,
    ),
    data: buildCrossDatasetGridData(
      structuresMap,
      dataMessagesMap,
      dataQueries,
      locale,
      chartStyles,
    ),
  };
}
