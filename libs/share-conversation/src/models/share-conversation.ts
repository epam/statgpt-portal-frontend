import { ReactNode } from 'react';
import {
  ConversationData,
  GeneratedLinkResponse,
  SharedConversationsRequest,
  SharedConversations,
} from '@statgpt/dial-toolkit/src/models/conversation';
import { Conversation } from '@epam/ai-dial-shared';

export type GetConversation = (conversationId: string) => Promise<Conversation>;

export interface ShareConversationProps {
  shareButtonClass?: string;
  shareIcon?: ReactNode;
  modalDividers?: boolean;
  getConversation?: GetConversation;
  generateConversationLink?: (
    conversationData?: ConversationData,
  ) => Promise<GeneratedLinkResponse>;
  getSharedConversations?: (
    requestData?: SharedConversationsRequest,
  ) => Promise<SharedConversations>;
  revokeSharedConversations?: (
    sharedConversations?: SharedConversations,
  ) => Promise<void>;
  shareCopiedLink?: string;
  shareCopyLink?: string;
  shareRemoveAccessToUsers?: string;
  share?: string;
  close?: string;
  shareLink?: string;
  chatExpirationDays?: string;
  chatExpiration?: string;
  shareDescription?: string;
  chatWarning?: string;
  chatName?: string;
  baseUrl?: string;
  id?: string[];
  clientSharedPage?: string;
  clientSharedProp?: string;
}
