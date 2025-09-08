import { Conversation } from '@epam/ai-dial-shared';
import { generateConversationId } from '@statgpt/dial-toolkit/src/utils/parse-conversation-name';

export const generateConversation = (
  conversation: Conversation,
  currentBucket: string,
  locale: string,
): Conversation => {
  const folderId = `${currentBucket}/${locale}`;
  const id = generateConversationId({
    folderId,
    name: conversation?.name,
  });

  return {
    ...conversation,
    folderId,
    id,
  };
};
