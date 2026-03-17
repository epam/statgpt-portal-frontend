import { ConversationInfo } from '@epam/ai-dial-shared';
import {
  ApiResponse,
  getConversationAttachmentUrls,
} from '@epam/statgpt-shared-toolkit';
import {
  deleteConversationApi,
  getConversationApi,
} from '../../app/api/conversations/client';
import { deleteFileApi } from '../../app/api/files/client';

export const deleteConversationAndAttachments = async (
  conversation: ConversationInfo,
): Promise<ApiResponse<void>> => {
  if (conversation.isShared) {
    return deleteConversationApi(conversation);
  }

  const conversationResponse = await getConversationApi(conversation.id);

  if (!conversationResponse.success) {
    return conversationResponse as ApiResponse<void>;
  }

  const fullConversation = conversationResponse.data;

  if (!fullConversation) {
    throw new Error('Conversation payload is missing');
  }

  const attachmentUrls = getConversationAttachmentUrls(fullConversation);
  const deleteFileResponses = await Promise.all(
    attachmentUrls.map((attachmentUrl) => deleteFileApi(attachmentUrl)),
  );
  const failedDeleteFileResponse = deleteFileResponses.find(
    (response) => !response.success,
  );

  if (failedDeleteFileResponse) {
    return failedDeleteFileResponse;
  }

  return deleteConversationApi(conversation);
};
