import { SharedConversations } from '@statgpt/dial-toolkit/src/models/conversation';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { ConversationGroups } from '@statgpt/conversation-list/src/types/conversation-groups';
import { getConversationId } from '@statgpt/shared-toolkit/src/utils/conversation-navigation-to-id';

export const updateConversationsWithSharedOption = (
  sharedConversationsData: SharedConversations,
  locale: string,
): ConversationInfo[] => {
  return (
    sharedConversationsData?.resources?.map((resource) => {
      const conversationId = resource?.url?.split('/')?.slice(1);

      return {
        ...resource,
        folderId: resource?.bucket,
        id: getConversationId(conversationId, locale),
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
