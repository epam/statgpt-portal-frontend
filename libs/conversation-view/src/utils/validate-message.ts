import { Role, Conversation } from '@epam/ai-dial-shared';
import { Message } from '@statgpt/dial-toolkit/src/models/message';
/**
 * Validates and prepares a message object for sending.
 * @param content - The content of the message.
 * @param isStreaming - Indicates if the message is being sent in a streaming context.
 * @param conversation - The current conversation context.
 * @returns A prepared message object or null if validation fails.
 */

export const validateAndPrepareMessage = (
  content: string,
  isStreaming: boolean,
  conversation: Conversation | null,
) => {
  if (!conversation || isStreaming) {
    return null;
  }

  return {
    id: `msg-${Date.now()}`,
    role: Role.User,
    content,
    timestamp: Date.now(),
  } as Message;
};
