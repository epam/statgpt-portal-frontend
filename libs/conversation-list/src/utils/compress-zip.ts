import { Attachment, Conversation } from '@epam/ai-dial-shared';
import JSZip from 'jszip';
import { omit, uniqBy } from 'lodash';
import { getConversationAttachments } from '@epam/statgpt-shared-toolkit';

interface DialFile {
  folderId: string;
  name: string;
  relativePath?: string;
  contentType: string;
  absolutePath: string;
}

export const getAttachments = (conversation: Conversation) => {
  const attachments = getDialFilesFromAttachments(
    getConversationAttachments(conversation),
  ).map((file) => ({
    ...file,
    relativePath: '',
    contentLength: 0,
  }));

  return uniqBy(attachments, (file) =>
    constructPath(file.relativePath, file.name),
  );
};

export const isFolderId = (id: string) => id.endsWith('/');

export const isAbsoluteUrl = (url: string): boolean => {
  const urlLower = url.toLowerCase();
  return [
    'data:',
    '//',
    'http://',
    'https://',
    'file://',
    'ftp://',
    'mailto:',
    'telnet://',
    'api/files',
  ].some((prefix) => urlLower.startsWith(prefix));
};

const parseAttachmentUrl = (url: string) => {
  const decodedUrl = constructPath(
    ...url.split('/').map((part) => decodeURIComponent(part)),
  );
  const lastIndexSlash = decodedUrl.lastIndexOf('/');

  return {
    absolutePath: decodedUrl.slice(0, lastIndexSlash),
    name: decodedUrl.slice(lastIndexSlash + 1),
  };
};

export const getDialFilesFromAttachments = (
  attachments?: Attachment[],
): DialFile[] => {
  if (!attachments) {
    return [];
  }

  return attachments
    .map((attachment) => {
      if (
        !attachment.url ||
        isAbsoluteUrl(attachment.url) ||
        isFolderId(attachment.url)
      ) {
        return null;
      }

      const { absolutePath, name } = parseAttachmentUrl(attachment.url);

      return {
        id: attachment.url,
        name,
        contentType: attachment.type,
        folderId: absolutePath,
        absolutePath,
      } as DialFile;
    })
    .filter(Boolean) as DialFile[];
};

export async function getZippedFile(
  conversation: Conversation,
  getFileBlob: (filePath: string) => Promise<Blob>,
): Promise<string> {
  const attachments = getAttachments(conversation);
  const zip = new JSZip();

  attachments.forEach((file) => {
    const path = encodeURI(constructPath(file.absolutePath, file.name));

    const fileBlob = getFileBlob(`${path}`.replace('files/', ''));
    const relativeParentPath = splitFolderId(file.folderId);
    const filePath = constructPath('res', relativeParentPath, file.name);

    zip.file(filePath, fileBlob);
  });

  const history = {
    version: 5,
    history: [conversation]?.map(excludePublicationInfo) || [],
    folders: [],
  };
  const jsonHistory = JSON.stringify(history, null, 2);
  zip.file(`conversations/conversations_history.json`, jsonHistory);

  const content = await zip.generateAsync({ type: 'base64' });
  return content;
}

export const splitFolderId = (folderId: string) => {
  const parts = folderId.split('/');
  const parentPath =
    parts.length > 2 ? constructPath(...parts.slice(2)) : undefined;

  return parentPath;
};

const excludePublicationInfo = <T extends object>(
  entity: T,
): Omit<T, 'publicationInfo'> =>
  omit(entity, ['publicationInfo']) as Omit<T, 'publicationInfo'>;

export const constructPath = (
  ...values: (string | undefined | null)[]
): string => {
  return values.filter(Boolean).join('/');
};
