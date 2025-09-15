import { Conversation } from '@epam/ai-dial-shared';
import { getConversationNavPath } from '@statgpt/shared-toolkit/src';

export const getRedirectConversationPath = (
  conversation: Conversation,
  locale?: string,
  conversationsRoute?: string,
): string => {
  return `/${locale}${conversationsRoute}/${getConversationNavPath(conversation?.folderId, conversation?.id)}`;
};
