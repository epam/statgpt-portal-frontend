import { SharedConversations } from '@epam/statgpt-dial-toolkit';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { ConversationGroups } from '../types/conversation-groups';

export const transformSharedConversations = (
  sharedConversationsData: SharedConversations,
  locale: string,
): ConversationInfo[] => {
  return (
    sharedConversationsData?.resources
      ?.filter((resource) => resource?.parentPath === locale)
      ?.map((sharedConversation) => {
        const folderId = `${sharedConversation?.bucket}/${locale}`;
        const id = sharedConversation?.url?.split('/')?.slice(1)?.join('/');

        return {
          ...sharedConversation,
          folderId,
          id,
          isShared: true,
        };
      }) || []
  );
};

export const getSharedConversationsGroup = (
  sharedConversations: ConversationInfo[],
): Record<string, ConversationInfo[]> => {
  return {
    [ConversationGroups.SHARED]: sharedConversations,
  };
};
