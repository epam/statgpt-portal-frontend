import { Conversation, ConversationInfo } from '@epam/ai-dial-shared';
import {
  ConversationData,
  ConversationResource,
  GeneratedLinkResponse,
  InvitationType,
  SharedConversationInfo,
} from '@epam/statgpt-dial-toolkit';
import { SHARE_CONVERSATION_ROUTE } from '../constants/share-conversation';

export const getConversationData = (
  id: string,
  conversationResources: ConversationResource[],
): ConversationData => {
  return {
    invitationType: InvitationType.LINK,
    resources: [
      {
        url: `conversations/${encodeURI(id)}`,
      },
      ...conversationResources,
    ],
  };
};

export const getConversationLink = (
  generatedLink: GeneratedLinkResponse,
): string => {
  const conversationId = generatedLink?.invitationLink?.split('/').at(-1) || '';
  return `/${SHARE_CONVERSATION_ROUTE}/${conversationId}`;
};

export const getSharedConversation = (
  currentConversation?: ConversationInfo | null,
  sharedConversations?: SharedConversationInfo[],
): SharedConversationInfo | undefined => {
  return sharedConversations?.find((sharedConversation) => {
    const currentConversationId = currentConversation?.id?.split('/')?.pop();
    const sharedConversationId =
      sharedConversation?.url?.split('/')?.pop() || '';
    return (
      sharedConversationId === currentConversationId ||
      decodeURI(sharedConversationId) === currentConversationId
    );
  });
};

export const getConversationResources = (
  conversation?: Conversation,
): ConversationResource[] => {
  const messagesWithAttachments = conversation?.messages?.filter(
    (message) => !!message?.custom_content?.attachments,
  );
  return (
    messagesWithAttachments
      ?.flatMap((message) => {
        return (
          message?.custom_content?.attachments?.map((attachment) => ({
            url: attachment?.url || '',
          })) || []
        );
      })
      ?.filter((resource) => !!resource?.url) || []
  );
};
