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
  );

  return {
    title: titles?.dataGrid || 'Data',
    gridContent,
  };
}

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
  constraintsMap?: Map<string, DataConstraints[] | undefined>,
  selectedTimePeriod?: TimeRange,
): { data: GridData[]; columns: ColDef[] } {
  return {
    columns: buildCrossDatasetGridColumns(
      structuresMap,
      datasetDimensionsSchemesMap,
      dataMessagesMap,
      locale,
      titles,
      formattingSettings,
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
