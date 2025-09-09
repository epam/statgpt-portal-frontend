import { ReactNode } from 'react';
import {
  ConversationData,
  GeneratedLinkResponse,
  SharedConversationsRequest,
  SharedConversations,
} from '@statgpt/dial-toolkit/src/models/conversation';

export interface ShareConversationProps {
  shareButtonClass?: string;
  shareIcon?: ReactNode;
  modalDividers?: boolean;
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
}
