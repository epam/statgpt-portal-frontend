import { ConversationDetails } from '@statgpt/conversation-view/src/models/conversation';
import { Conversation } from '@epam/ai-dial-shared';
import { getConversationNavPath } from '@statgpt/shared-toolkit/src';

export const getConversationPath = (
  conversationDetails: ConversationDetails,
  bucketId?: string,
): string => {
  return conversationDetails?.bucketId === bucketId || !bucketId
    ? `${conversationDetails?.bucketId}/${conversationDetails?.locale}/${conversationDetails?.conversationId}`
    : `${conversationDetails?.bucketId}/${conversationDetails?.conversationId}`;
};

export const getRedirectConversationPath = (
  conversation: Conversation,
  locale?: string,
  conversationsRoute?: string,
): string => {
  return `/${locale}${conversationsRoute}/${getConversationNavPath(conversation?.folderId, conversation?.id)}`;
};
