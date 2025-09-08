import {
  ConversationData,
  GeneratedLinkResponse,
  SharedConversationInfo,
} from '@statgpt/dial-toolkit/src/models/conversation';
import { InvitationType } from '@statgpt/dial-toolkit/src/types/invitation-type';
import { ConversationInfo } from '@epam/ai-dial-shared';

export const getConversationData = (id?: string): ConversationData => {
  return {
    invitationType: InvitationType.LINK,
    resources: [
      {
        url: `conversations/${encodeURI(id || '')}`,
      },
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
    const sharedConversationName =
      sharedConversation?.name?.split('/')?.pop() || '';
    return (
      sharedConversationName === currentConversationId ||
      decodeURI(sharedConversationName) === currentConversationId
    );
  });
};
