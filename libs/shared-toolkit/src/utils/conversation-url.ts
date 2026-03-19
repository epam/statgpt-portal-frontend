import { deleteConversationNamePostfix } from './conversation-name';

export const getConversationUrlWithoutLocale = (
  resourceUrl: string,
  locale: string,
) => {
  return resourceUrl
    ?.split('/')
    ?.filter((item: string) => item !== locale)
    ?.join('/');
};

export const getConversationIdFromResourceUrl = (resourceUrl: string): string =>
  resourceUrl.replace(/^conversations\//, '');

export const getConversationFolderIdFromConversationId = (
  conversationId: string,
): string => conversationId.split('/').slice(0, -1).join('/');

export const getConversationNameFromConversationId = (
  conversationId: string,
): string =>
  deleteConversationNamePostfix(
    decodeURIComponent(conversationId.split('/').at(-1) ?? ''),
  );
