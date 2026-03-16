import { ConversationInfo } from '@epam/ai-dial-shared';
import { stripConversationVersionSuffix } from './conversation-name';

export const cleanConversationNames = (
  conversations: ConversationInfo[],
): ConversationInfo[] =>
  conversations.map((conversation) => ({
    ...conversation,
    name: stripConversationVersionSuffix(conversation.name),
  }));
