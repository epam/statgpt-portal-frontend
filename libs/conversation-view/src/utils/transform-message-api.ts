import { Conversation } from '@epam/ai-dial-shared';
import { Message } from '@statgpt/dial-toolkit/src/models/message';

export const transformMessagesForApi = (
  userMessage: Message,
  conversation: Conversation | null,
) => {
  return [...(conversation?.messages || []), userMessage].map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};
