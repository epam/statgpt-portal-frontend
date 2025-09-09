import { ColDef } from 'ag-grid-community';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { DataMessage } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { getColumns } from '@statgpt/conversation-view/src/utils/attachments/data-grid/columns';
import { getRowsData } from '@statgpt/conversation-view/src/utils/attachments/data-grid/rows-data';
import { GridData } from '@statgpt/conversation-view/src/types/data-grid/grid-data';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';
import { MetadataSettings } from '@statgpt/conversation-view/src/models/metadata';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { ChartingStyles } from '@statgpt/conversation-view/src/models/attachments-styles';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

export function buildGridData(
  structures: StructuralData,
  data: DataMessage,
  dataQuery: DataQuery | undefined,
  locale: string,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  chartStyles?: ChartingStyles,
  titles?: ConversationViewTitles,
): { data: GridData[]; columns: ColDef[] } {
  return {
    columns: getColumns(
      structures,
      data,
      locale,
      formattingSettings,
      metadataSettings,
      titles,
    ),
    data: getRowsData(data, structures, dataQuery, locale, chartStyles),
  };
}
