import { Role, Conversation } from '@epam/ai-dial-shared';
import { Message } from '@epam/statgpt-dial-toolkit';
import {
  CUSTOM_CHOICE_ID,
  CustomContentProperties,
} from '../constants/custom-content-properties';

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
  customChoiceId?: string,
) => {
  if (!conversation || isStreaming) {
    return null;
  }

  const data = {
    id: `msg-${Date.now()}`,
    role: Role.User,
    content,
    timestamp: Date.now(),
  } as Message;

  if (customChoiceId) {
    const prop =
      customChoiceId === CUSTOM_CHOICE_ID.COMPLETE
        ? CustomContentProperties.COMPLETION
        : CustomContentProperties.CHOICE;
    data.custom_content = {
      form_value: { [prop]: customChoiceId },
    };
  }
  return data;
};
