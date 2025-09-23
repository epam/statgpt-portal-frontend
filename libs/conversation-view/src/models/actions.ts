import {
  GetAttachmentContent,
  GetBucket,
  GetDatasetData,
  GetDatasetDetails,
  UpdateConversation,
  getConstraints,
  CreateConversation,
} from '../types/actions';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { DownloadDatasetAction } from '@statgpt/download-panel/src/types/actions';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { GetConversation } from '@statgpt/share-conversation/src/models/share-conversation';
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
