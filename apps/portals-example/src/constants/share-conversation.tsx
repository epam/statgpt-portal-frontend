import { IconUpload } from '@tabler/icons-react';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { AuthHandler } from '../utils/auth/requests-wrapper';
import {
  generateConversationLinkApi,
  getSharedConversationsApi,
  revokeSharedConversationsApi,
} from '../app/api/share/client';
import { getConversationApi } from '../app/api/conversations/client';

export const SHARE_CONVERSATION_PROPS = (
  authHandler: AuthHandler,
): ShareConversationProps => ({
  shareIcon: <IconUpload />,
  getConversation: authHandler(getConversationApi),
  generateConversationLink: generateConversationLinkApi,
  getSharedConversations: authHandler(getSharedConversationsApi),
  revokeSharedConversations: authHandler(revokeSharedConversationsApi),
});
