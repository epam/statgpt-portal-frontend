import { ConversationInfo } from '@epam/ai-dial-shared';
import { deleteConversationNamePostfix } from './conversation-name';

export const cleanConversationNames = (
  conversations: ConversationInfo[],
): ConversationInfo[] =>
  conversations.map((conversation) => ({
    ...conversation,
    name: deleteConversationNamePostfix(conversation.name),
  }));
