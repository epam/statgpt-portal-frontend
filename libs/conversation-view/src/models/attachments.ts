import { Attachment } from '@epam/ai-dial-shared';
import { AttachmentsStyles } from './attachments-styles';
import { GridData } from '../types/data-grid/grid-data';
import { DataQuery, QueryFilterDetails } from '@epam/statgpt-shared-toolkit';
import { ColDef } from 'ag-grid-community';
import { ChartingData } from './charting';
import { Dataflow } from '@epam/statgpt-sdmx-toolkit';

export interface CustomGridAttachment extends Attachment {
  grid_data?: { data: GridData[]; columns: ColDef[] };
}

export interface CrossDatasetGridAttachmentType extends Attachment {
  gridContent?: { data: GridData[]; columns: ColDef[] };
}

export interface CustomChartAttachmentType extends Attachment {
  charting_data?: ChartingData;
}

export interface CustomCodeAttachment extends Attachment {
  language?: string;
}

export interface AttachmentsProps {
  currentDataQuery?: DataQuery;
  dataQueries?: DataQuery[];
  datasets?: Dataflow[];
  styles?: AttachmentsStyles;
  showExternalButton?: boolean;
}

export interface AttachmentInfo {
  datasetName?: string;
  queryFiltersDetails?: QueryFilterDetails[];
}

export interface AttachmentsConfig {
  isExternaLinkIncludeFilters?: boolean;
}
