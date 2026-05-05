import {
  GetAttachmentContent,
  GetAttachmentBlob,
  GetBucket,
  GetDatasetData,
  GetDatasetDetails,
  UpdateConversation,
  getConstraints,
  CreateConversation,
  RateResponse,
  PutOnboardingFile,
  PutFile,
  GetPythonAttachment,
} from '../types/actions';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { Dataflow } from '@epam/statgpt-sdmx-toolkit';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { DownloadDatasetAction } from '@statgpt/download-panel/src/types/actions';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { GetConversation } from '@statgpt/share-conversation/src/models/share-conversation';
import { ConversationInfo } from '@epam/ai-dial-shared';

export interface AttachmentsActions {
  getFile: GetAttachmentContent;
  putOnboardingFile: PutOnboardingFile;
  getDataSet: GetDatasetDetails;
  getDataSetData: GetDatasetData;
  getConstraints: getConstraints;
  downloadDataSet: DownloadDatasetAction;
  updateCurrentDataQuery: (dataQuery?: DataQuery) => void;
  updateDataQueries: (dataQueries?: DataQuery[]) => void;
  updateDatasets: (datasets?: Dataflow[]) => void;
  getPythonAttachment?: GetPythonAttachment;
}
export type ConversationViewActions = AttachmentsActions & {
  getConversation: GetConversation;
  getConversations: (locale: string) => Promise<ConversationInfo[]>;
  getBucket: GetBucket;
  getFileBlob?: GetAttachmentBlob;
  updateConversation: UpdateConversation;
  createConversation: CreateConversation;
  putFile?: PutFile;
  rateResponse: RateResponse;
};

export type AdvancedViewActions = AttachmentsActions;
