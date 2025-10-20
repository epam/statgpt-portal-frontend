import { ColDef } from 'ag-grid-community';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { DataMessage } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { getColumns } from './columns';
import { getRowsData } from './rows-data';
import { GridData } from '../../../types/data-grid/grid-data';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';
import { MetadataSettings } from '../../../models/metadata';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { ChartingStyles } from '../../../models/attachments-styles';
import { ConversationViewTitles } from '../../../models/titles';
import { DataConstraints } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/constraints';
import { TimeRange } from '@statgpt/shared-toolkit/src';
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
