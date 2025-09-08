import { Conversation, SharePermission } from '@epam/ai-dial-shared';

const LOCAL_BUCKET = 'local';

export const isReadOnlyConversation = (conversation: Conversation) =>
  !conversation.permissions?.includes(SharePermission.WRITE) &&
  !isConversationIdLocal(conversation);

export const isConversationIdExternal = (
  conversation: Conversation,
  bucket: string,
) => {
  const conversationBucket = getConversationBucket(conversation);
  return conversationBucket !== bucket;
};

export const isConversationIdLocal = (conversation: Conversation) =>
  getConversationBucket(conversation) === LOCAL_BUCKET;

export const getConversationBucket = (conversation: Conversation) =>
  conversation.id.split('/')[0];
