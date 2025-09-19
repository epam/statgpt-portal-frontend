import { ConversationInfo } from '@epam/ai-dial-shared';

export const cleanConversationNames = (
  conversations: ConversationInfo[],
): ConversationInfo[] =>
  conversations.map((conversation) => ({
    ...conversation,
    name: conversation.name.split(/-\d+$/)[0],
  }));
