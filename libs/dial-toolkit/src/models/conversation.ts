import { ConversationInfo } from '@epam/ai-dial-shared';
import { Message } from '@statgpt/dial-toolkit/src/models/message';
import { ModelInfo } from '@statgpt/dial-toolkit/src/models/model';
import { InvitationType } from '@statgpt/dial-toolkit/src/types/invitation-type';
import {
  ResourceTypes,
  ShareTarget,
} from '@statgpt/dial-toolkit/src/constants/share-conversation';

export interface CreateConversationRequest {
  name: string;
  folderId: string;
  model?: ModelInfo;
  prompt?: string;
  temperature?: number;
  selectedAddons?: string[];
}

export interface UpdateConversationRequest {
  name?: string;
  folderId?: string;
  model?: ModelInfo;
  prompt?: string;
  temperature?: number;
  messages: Message[];
}

export interface ConversationListResponse {
  conversations: ConversationInfo[];
  total?: number;
  hasMore?: boolean;
}

interface ConversationResource {
  url: string;
}

export interface ConversationData {
  invitationType?: InvitationType;
  resources: ConversationResource[];
}

export interface GeneratedLinkResponse {
  invitationLink: string;
}

export interface SharedConversationsRequest {
  resourceTypes: ResourceTypes[];
  with: ShareTarget;
}

export interface SharedConversationInfo extends ConversationInfo {
  bucket: string;
  url: string;
}

export interface SharedConversationsResponse {
  resources: SharedConversationInfo[];
}
