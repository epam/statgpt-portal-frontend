import { SharedConversations } from '@statgpt/dial-toolkit/src/models/conversation';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { ConversationGroups } from '@statgpt/conversation-list/src/types/conversation-groups';

export const updateConversationsWithSharedOption = (
  sharedConversationsData: SharedConversations,
  locale: string,
): ConversationInfo[] => {
  return (
    sharedConversationsData?.resources?.map((resource) => {
      const folderId = `${resource?.bucket}/${locale}`;
      const id = resource?.url?.split('/')?.slice(1)?.join('/');

      return {
        ...resource,
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
