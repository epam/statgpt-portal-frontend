import {
  getConversation,
  getSharedConversations,
  revokeSharedConversations,
} from '../app/actions/conversations';
import { IconUpload } from '@tabler/icons-react';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { AuthHandler } from '../utils/auth/requests-wrapper';
import { generateConversationLinkApi } from '../app/api/share/client';

export const SHARE_CONVERSATION_PROPS = (
  authHandler: AuthHandler,
): ShareConversationProps => ({
  shareIcon: <IconUpload />,
  getConversation: authHandler(getConversation),
  generateConversationLink: generateConversationLinkApi,
  getSharedConversations: authHandler(getSharedConversations),
  revokeSharedConversations: authHandler(revokeSharedConversations),
});
