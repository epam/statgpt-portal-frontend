import { Message } from '@statgpt/dial-toolkit/src/models';

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
      message?.custom_content?.attachments ? index : lastIndex,
    -1,
  );
};
