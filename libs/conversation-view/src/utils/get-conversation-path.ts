import { Conversation } from '@epam/ai-dial-shared';
import { getConversationNavPath } from '@epam/statgpt-shared-toolkit';

export const getRedirectConversationPath = (
  conversation: Conversation,
  locale?: string,
  conversationsRoute?: string,
): string => {
  return `/${locale}${conversationsRoute}/${getConversationNavPath(conversation?.folderId, conversation?.id)}`;
};
