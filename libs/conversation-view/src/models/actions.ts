import {
  GetAttachmentContent,
  GetBucket,
  GetConversation,
  GetDatasetData,
  GetDatasetDetails,
  UpdateConversation,
  getConstraints,
  CreateConversation,
} from '@statgpt/conversation-view/src/types/actions';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';
import { DownloadDatasetAction } from '@statgpt/download-panel/src/types/actions';
import { ConversationInfo } from '@epam/ai-dial-shared';

export interface AttachmentsActions {
  getFile: GetAttachmentContent;
  getDataSet: GetDatasetDetails;
  getDataSetData: GetDatasetData;
  getConstraints: getConstraints;
  downloadDataSet: DownloadDatasetAction;
  updateCurrentDataQuery: (dataQuery?: DataQuery) => void;
  updateDataQueries: (dataQueries?: DataQuery[]) => void;
  updateDatasets: (datasets?: Dataflow[]) => void;
}
export type ConversationViewActions = AttachmentsActions & {
  getConversation: GetConversation;
  getConversations: (locale: string) => Promise<ConversationInfo[]>;
  getBucket: GetBucket;
  updateConversation: UpdateConversation;
  createConversation: CreateConversation;
};

export type AdvancedViewActions = AttachmentsActions;
