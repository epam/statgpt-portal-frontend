import {
  ConversationData,
  ConversationResource,
  GeneratedLinkResponse,
  SharedConversationInfo,
} from '@statgpt/dial-toolkit/src/models/conversation';
import { InvitationType } from '@statgpt/dial-toolkit/src/types/invitation-type';
import { Conversation, ConversationInfo } from '@epam/ai-dial-shared';

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
  return `/share/${conversationId}`;
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
