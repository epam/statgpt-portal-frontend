import { Attachment } from '@epam/ai-dial-shared';
import { AttachmentsStyles } from '@statgpt/conversation-view/src/models/attachments-styles';
import { GridData } from '@statgpt/conversation-view/src/types/data-grid/grid-data';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { ColDef } from 'ag-grid-community';
import { ChartingData } from '@statgpt/conversation-view/src/models/charting';
import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';

export interface CustomGridAttachment extends Attachment {
  grid_data?: { data: GridData[]; columns: ColDef[] };
}

export interface CustomChartAttachmentType extends Attachment {
  charting_data?: ChartingData;
}

export interface AttachmentsProps {
  currentDataQuery?: DataQuery;
  dataQueries?: DataQuery[];
  datasets?: Dataflow[];
  styles?: AttachmentsStyles;
}
