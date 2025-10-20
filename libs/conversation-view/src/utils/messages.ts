import { Message } from '@statgpt/dial-toolkit/src/models';
import { isJsonAttachment } from './attachments/attachment-parser';
import { Role } from '@epam/ai-dial-shared';

export const getPreviousMessageWithAttachment = (
  messages: Message[],
  currentMessageIndex: number,
): Message | undefined => {
  return messages
    ?.filter(
      (message, index) =>
        message?.custom_content?.attachments && index < currentMessageIndex,
    )
    ?.at(-1);
};

export const getLastMessageWithAttachmentIndex = (
  messages: Message[],
): number => {
  return messages?.reduce(
    (lastIndex, message, index) =>
      message?.custom_content?.attachments?.some((attachment) =>
        isJsonAttachment(attachment),
      )
        ? index
        : lastIndex,
    -1,
  );
};

export const getLastAssistantMessage = (
  messages: Message[],
): Message | undefined => {
  return messages?.reduce(
    (previousMessage, message) =>
      message?.role === Role.Assistant ? message : previousMessage,
    {} as Message,
  );
};
