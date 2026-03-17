import {
  DataConstraints,
  DataMessage,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  FormatNumbersType,
  TimeRange,
} from '@epam/statgpt-shared-toolkit';
import { CustomGridAttachment } from '../../../models/attachments';
import { MetadataSettings } from '../../../models/metadata';
import { ChartingStyles } from '../../../models/attachments-styles';
import { ConversationViewTitles } from '../../../models/titles';
import { PutOnboardingFile } from '../../../types/actions';
import { buildGridData } from './data-grid';

export function buildCustomGridAttachment(
  structures: StructuralData,
  dataMessage: DataMessage,
  dataQuery: DataQuery | undefined,
  locale: string,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  chartStyles?: ChartingStyles,
  titles?: ConversationViewTitles,
  putOnboardingFile?: PutOnboardingFile,
  constraints?: DataConstraints[],
  selectedTimePeriod?: TimeRange,
): Partial<CustomGridAttachment> {
  const dataSetName = structures.dataflows?.[0]?.names?.[locale];
  const gridData = buildGridData(
    structures,
    dataMessage,
    dataQuery,
    locale,
    formattingSettings,
    metadataSettings,
    chartStyles,
    titles,
    putOnboardingFile,
    constraints,
    selectedTimePeriod,
  );

  return {
    title: dataSetName || titles?.dataGrid || 'Data Grid',
    grid_data: gridData,
  };
}
