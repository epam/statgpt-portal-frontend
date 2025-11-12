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
import { ColDef } from 'ag-grid-community';
import { getColumns } from './columns';
import { getRowsData } from './rows-data';
import { GridData } from '../../../types/data-grid/grid-data';
import { MetadataSettings } from '../../../models/metadata';
import { ChartingStyles } from '../../../models/attachments-styles';
import { ConversationViewTitles } from '../../../models/titles';
import { PutOnboardingFile } from '../../../types/actions';

export function buildGridData(
  structures: StructuralData,
  data: DataMessage,
  dataQuery: DataQuery | undefined,
  locale: string,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  chartStyles?: ChartingStyles,
  titles?: ConversationViewTitles,
  action?: PutOnboardingFile,
  constraints?: DataConstraints[],
  selectedTimePeriod?: TimeRange,
): { data: GridData[]; columns: ColDef[] } {
  return {
    columns: getColumns(
      structures,
      data,
      locale,
      formattingSettings,
      metadataSettings,
      titles,
      action,
      constraints,
      selectedTimePeriod,
    ),
    data: getRowsData(data, structures, dataQuery, locale, chartStyles),
  };
}
