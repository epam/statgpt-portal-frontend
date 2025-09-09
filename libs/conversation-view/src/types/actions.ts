import { GridAttachmentContent } from '@statgpt/dial-toolkit/src/models/grid-attachment';
import { StructuralMetaData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { UpdateConversationRequest } from '@statgpt/dial-toolkit/src/models/conversation';
import { Conversation, ConversationInfo } from '@epam/ai-dial-shared';
import { DataMessage } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { SeriesFilterDto } from '@statgpt/sdmx-toolkit/src/models/series-filter';
import { SdmxReferences } from '@statgpt/sdmx-toolkit/src/types/references';
import { TimeRange } from '@statgpt/shared-toolkit/src/models/time-range';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';

export type GetAttachmentContent = (
  fileId: string,
) => Promise<GridAttachmentContent | null>;

export type GetDatasetDetails = (
  datasetId: string,
  references?: SdmxReferences,
) => Promise<StructuralMetaData | null>;

export type GetDatasetData = (
  datasetId: string,
  filters: DatasetQueryFilters,
) => Promise<DataMessage | null>;

export type GetConversation = (conversationId: string) => Promise<Conversation>;

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
