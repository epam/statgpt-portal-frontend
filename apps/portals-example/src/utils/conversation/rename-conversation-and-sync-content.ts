import { ConversationInfo } from '@epam/ai-dial-shared';
import {
  getConversationFolderIdFromConversationId,
  getConversationIdFromResourceUrl,
  getConversationNameFromConversationId,
  getConversationNavPath,
  ApiResponse,
} from '@epam/statgpt-shared-toolkit';
import {
  getConversationApi,
  renameConversationApi,
  updateConversationApi,
} from '../../app/api/conversations/client';
import { UpdateConversationRequest } from '@epam/statgpt-dial-toolkit';

interface RenameConversationAndSyncContentResult {
  navPath?: string;
  response: ApiResponse<ConversationInfo>;
}

export const renameConversationAndSyncContent = async (
  sourceUrl: string,
  destinationUrl: string,
): Promise<RenameConversationAndSyncContentResult> => {
  const renameResponse = await renameConversationApi(sourceUrl, destinationUrl);

  if (!renameResponse.success) {
    return {
      response: renameResponse as ApiResponse<ConversationInfo>,
    };
  }

  const renamedConversationId =
    getConversationIdFromResourceUrl(destinationUrl);
  const renamedConversationFolderId = getConversationFolderIdFromConversationId(
    renamedConversationId,
  );
  const renamedConversationName = getConversationNameFromConversationId(
    renamedConversationId,
  );
  const renamedConversationResponse = await getConversationApi(
    renamedConversationId,
  );

  if (!renamedConversationResponse.success) {
    return {
      response: renamedConversationResponse as ApiResponse<ConversationInfo>,
    };
  }

  const renamedConversation = renamedConversationResponse.data;

  if (!renamedConversation) {
    throw new Error('Renamed conversation payload is missing');
  }

  const updateConversationRequest: UpdateConversationRequest = {
    ...renamedConversation,
    id: renamedConversationId,
    folderId: renamedConversationFolderId,
    name: renamedConversationName,
    messages: renamedConversation.messages,
  };

  const updateConversationResponse = await updateConversationApi(
    renamedConversationId,
    updateConversationRequest,
  );

  return {
    navPath: updateConversationResponse.success
      ? getConversationNavPath(
          renamedConversationFolderId,
          renamedConversationId,
        )
      : undefined,
    response: updateConversationResponse,
  };
};
