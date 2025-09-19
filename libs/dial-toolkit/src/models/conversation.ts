import { ConversationInfo } from '@epam/ai-dial-shared';
import { Message } from './message';
import { ModelInfo } from './model';
import { InvitationType } from '../types/invitation-type';
import { ResourceTypes, ShareTarget } from '../constants/share-conversation';

export interface CreateConversationRequest {
  name: string;
  folderId: string;
  model?: ModelInfo;
  messages?: Message[];
  id?: string;
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
  parentPath?: string;
}

export interface SharedConversations {
  resources: SharedConversationInfo[];
}
