import {
  ConversationData,
  GeneratedLinkResponse,
  SharedConversations,
  SharedConversationsRequest,
} from '@epam/statgpt-dial-toolkit';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest, apiRequestVoid } from '../api-client';

const SHARE_API_ENDPOINT = '/api/share';

export async function generateConversationLinkApi(
  conversationData?: ConversationData,
): Promise<GeneratedLinkResponse> {
  const response = await fetch(SHARE_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(conversationData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to generate conversation link: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`,
    );
  }

  return response.json();
}

export async function getSharedConversationsApi(
  requestData?: SharedConversationsRequest,
): Promise<ApiResponse<SharedConversations>> {
  return apiRequest(`${SHARE_API_ENDPOINT}/list`, 'Failed to get shared conversations', {
    method: 'POST',
    body: requestData,
  });
}

export async function revokeSharedConversationsApi(
  sharedConversations?: SharedConversations,
): Promise<ApiResponse<void>> {
  return apiRequestVoid(
    `${SHARE_API_ENDPOINT}/revoke`,
    'Failed to revoke shared conversations',
    {
      method: 'POST',
      body: sharedConversations,
    },
  );
}
