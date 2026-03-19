import { Attachment, Conversation } from '@epam/ai-dial-shared';

export const getConversationAttachments = (
  conversation: Conversation,
): Attachment[] => {
  return conversation.messages.flatMap((message) => {
    const attachments = message.custom_content?.attachments ?? [];
    const stageAttachments =
      message.custom_content?.stages?.flatMap(
        ({ attachments }) => attachments ?? [],
      ) ?? [];

    return [...attachments, ...stageAttachments];
  });
};

const isFolderId = (id: string): boolean => id.endsWith('/');

const isExternalAttachmentUrl = (url: string): boolean => {
  const normalizedUrl = url.toLowerCase();

  return (
    normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')
  );
};

export const isDialFileAttachmentUrl = (url: string): boolean => {
  return Boolean(url) && !isExternalAttachmentUrl(url) && !isFolderId(url);
};

export const getConversationAttachmentUrls = (
  conversation: Conversation,
): string[] => {
  return [
    ...new Set(
      getConversationAttachments(conversation)
        .map((attachment) => attachment.url)
        .filter((url): url is string => Boolean(url))
        .filter((url) => isDialFileAttachmentUrl(url)),
    ),
  ];
};

const replaceAttachmentUrls = (
  attachments: Attachment[] | undefined,
  attachmentUrlMap: Record<string, string>,
): Attachment[] | undefined => {
  return attachments?.map((attachment) => ({
    ...attachment,
    url: attachment.url
      ? (attachmentUrlMap[attachment.url] ?? attachment.url)
      : attachment.url,
  }));
};

export const replaceConversationAttachmentUrls = (
  conversation: Conversation,
  attachmentUrlMap: Record<string, string>,
): Conversation => {
  return {
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      custom_content: message.custom_content
        ? {
            ...message.custom_content,
            attachments: replaceAttachmentUrls(
              message.custom_content.attachments,
              attachmentUrlMap,
            ),
            stages: message.custom_content.stages?.map((stage) => ({
              ...stage,
              attachments: replaceAttachmentUrls(
                stage.attachments,
                attachmentUrlMap,
              ),
            })),
          }
        : message.custom_content,
    })),
  };
};
