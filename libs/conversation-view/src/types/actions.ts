import {
  GridAttachmentContent,
  UpdateConversationRequest,
} from '@epam/statgpt-dial-toolkit';
import {
  DataMessage,
  DatasetQueryFilters,
  SdmxReferences,
  SeriesFilterDto,
  StructuralMetaData,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  OnboardingFileSchema,
  TimeRange,
} from '@epam/statgpt-shared-toolkit';
import { Conversation, ConversationInfo, Entity } from '@epam/ai-dial-shared';

export type GetAttachmentContent = (
  fileId: string,
) => Promise<GridAttachmentContent | null>;

export type GetAttachmentBlob = (fileId: string) => Promise<Blob>;

export type GetDatasetDetails = (
  datasetId: string,
  references?: SdmxReferences,
) => Promise<StructuralMetaData | null>;

export type GetDatasetData = (
  datasetId: string,
  filters: DatasetQueryFilters,
) => Promise<DataMessage | null>;

export type CreateConversation = (
  conversation: Conversation,
  locale: string,
) => Promise<ConversationInfo>;

export type GetBucket = () => Promise<{ bucket: string }>;

export type UpdateConversation = (
  conversationId: string,
  request: UpdateConversationRequest,
) => Promise<ConversationInfo>;

export type getConstraints = (
  urn: string,
  filters?: SeriesFilterDto[],
  timeRange?: TimeRange,
) => Promise<StructuralMetaData>;

export type RateResponse = (
  id: string,
  rate: boolean,
  deploymentId: string,
) => Promise<void>;

export type PutOnboardingFile = (
  fileName: string,
  filePath: string,
  fileData: OnboardingFileSchema,
) => Promise<Entity | null>;

export type PutFile = (filePath: string, file: Blob) => Promise<void>;

export type GetPythonAttachment = (
  queries: DataQuery[],
) => Promise<{ python_code: string } | null>;
