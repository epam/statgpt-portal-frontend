import { Attachment, Conversation } from '@epam/ai-dial-shared';

const getMessageAttachments = (conversation: Conversation): Attachment[] => {
  return conversation.messages.flatMap((message) => {
    const attachments = message.custom_content?.attachments ?? [];
    const stageAttachments =
      message.custom_content?.stages?.flatMap(
        ({ attachments }) => attachments ?? [],
      ) ?? [];

    return [...attachments, ...stageAttachments];
  });
};

export const getConversationAttachments = (
  conversation: Conversation,
): Attachment[] => {
  return getMessageAttachments(conversation);
};

export const getConversationAttachmentUrls = (
  conversation: Conversation,
): string[] => {
  return [
    ...new Set(
      getConversationAttachments(conversation)
        .map((attachment) => attachment.url)
        .filter((url): url is string => Boolean(url)),
    ),
  ];
};
