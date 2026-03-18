import { Conversation } from '@epam/ai-dial-shared';
import {
  getConversationAttachmentUrls,
  replaceConversationAttachmentUrls,
} from '@epam/statgpt-shared-toolkit';

interface DuplicateConversationAttachmentsOptions {
  conversation: Conversation;
  bucket: string;
  getFileBlob: (filePath: string) => Promise<Blob>;
  putFile: (filePath: string, file: Blob) => Promise<void>;
}

const addSuffixToFileName = (fileName: string, suffix: string): string => {
  const extensionIndex = fileName.lastIndexOf('.');

  if (extensionIndex <= 0) {
    return `${fileName}-${suffix}`;
  }

  return `${fileName.slice(0, extensionIndex)}-${suffix}${fileName.slice(extensionIndex)}`;
};

const buildDuplicatedAttachmentUrl = (
  attachmentUrl: string,
  bucket: string,
  suffix: string,
): string => {
  const pathParts = attachmentUrl.split('/');

  if (pathParts[0] !== 'files' || pathParts.length < 3) {
    return attachmentUrl;
  }

  const fileName = pathParts.at(-1) ?? 'file';
  const duplicatedFileName = addSuffixToFileName(fileName, suffix);

  return ['files', bucket, ...pathParts.slice(2, -1), duplicatedFileName].join(
    '/',
  );
};

export const duplicateConversationAttachments = async ({
  conversation,
  bucket,
  getFileBlob,
  putFile,
}: DuplicateConversationAttachmentsOptions): Promise<Conversation> => {
  const attachmentUrls = getConversationAttachmentUrls(conversation);
  const duplicatedAt = Date.now();

  if (!attachmentUrls.length) {
    return conversation;
  }

  const attachmentUrlEntries = await Promise.all(
    attachmentUrls.map(async (attachmentUrl) => {
      const duplicatedAttachmentUrl = buildDuplicatedAttachmentUrl(
        attachmentUrl,
        bucket,
        `${duplicatedAt}`,
      );

      if (duplicatedAttachmentUrl === attachmentUrl) {
        return [attachmentUrl, duplicatedAttachmentUrl] as const;
      }

      const fileBlob = await getFileBlob(attachmentUrl);
      await putFile(duplicatedAttachmentUrl, fileBlob);

      return [attachmentUrl, duplicatedAttachmentUrl] as const;
    }),
  );

  return replaceConversationAttachmentUrls(
    conversation,
    Object.fromEntries(attachmentUrlEntries),
  );
};
