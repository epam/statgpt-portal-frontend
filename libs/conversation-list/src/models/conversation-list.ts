import { ConversationInfo, Conversation } from '@epam/ai-dial-shared';
import { ReactNode } from 'react';
import { ActionMenuItem } from '@statgpt/conversation-list/src/types/action-menu-item';
import { ConversationListTitles } from './titles';
import {
  SharedConversationsRequest,
  SharedConversations,
} from '@statgpt/dial-toolkit/src/models/conversation';

export interface ConversationListActions {
  deleteConversation: (conversation: ConversationInfo) => Promise<void>;
  getConversation: (conversationId: string) => Promise<Conversation>;
  getFileBlob: (path: string) => Promise<Blob>;
  getConversations: (locale: string) => Promise<ConversationInfo[]>;
  getSharedConversations: (
    requestData?: SharedConversationsRequest,
  ) => Promise<SharedConversations>;
}

export type GroupedConversations = Record<string, ConversationInfo[]>;

export interface ConversationStyles {
  conversationItemIcon?: ReactNode;
  disableModalDividers?: boolean;
  isSmallModalButton?: boolean;
  actionsIcons?: Record<ActionMenuItem, ReactNode>;
  titles: ConversationListTitles;
}
