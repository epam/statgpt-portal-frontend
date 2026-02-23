import { Conversation, ConversationInfo } from '@epam/ai-dial-shared';
import {
  CreateConversationRequest,
  UpdateConversationRequest,
} from '@epam/statgpt-dial-toolkit';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest, apiRequestVoid } from '../api-client';

const CONVERSATIONS_API_ENDPOINT = '/api/conversations';

export async function getConversationsApi(
  locale?: string,
): Promise<ApiResponse<ConversationInfo[]>> {
  const params = new URLSearchParams();
  if (locale) {
    params.append('locale', locale);
  }

  const url = params.toString()
    ? `${CONVERSATIONS_API_ENDPOINT}?${params.toString()}`
    : CONVERSATIONS_API_ENDPOINT;

  return apiRequest(url, 'Failed to fetch conversations');
}

export async function getConversationApi(
  conversationId: string,
): Promise<ApiResponse<Conversation>> {
  return apiRequest(
    `${CONVERSATIONS_API_ENDPOINT}/${encodeURIComponent(conversationId)}`,
    'Failed to fetch conversation',
  );
}

export async function createConversationApi(
  request: CreateConversationRequest,
): Promise<ApiResponse<ConversationInfo>> {
  return apiRequest(
    CONVERSATIONS_API_ENDPOINT,
    'Failed to create conversation',
    {
      method: 'POST',
      body: request,
    },
  );
}

export async function updateConversationApi(
  conversationId: string,
  request: UpdateConversationRequest,
): Promise<ApiResponse<ConversationInfo>> {
  return apiRequest(
    `${CONVERSATIONS_API_ENDPOINT}/${encodeURIComponent(conversationId)}`,
    'Failed to update conversation',
    {
      method: 'PUT',
      body: request,
    },
  );
}

export async function deleteConversationApi(
  conversation: ConversationInfo,
): Promise<ApiResponse<void>> {
  return apiRequestVoid(
    `${CONVERSATIONS_API_ENDPOINT}/${encodeURIComponent(conversation.id)}`,
    'Failed to delete conversation',
    {
      method: 'DELETE',
      body: conversation,
    },
  );
}

export async function renameConversationApi(
  sourceUrl: string,
  destinationUrl: string,
): Promise<ApiResponse<void>> {
  return apiRequestVoid(
    `${CONVERSATIONS_API_ENDPOINT}/rename`,
    'Failed to rename conversation',
    {
      method: 'POST',
      body: { sourceUrl, destinationUrl },
    },
  );
}
