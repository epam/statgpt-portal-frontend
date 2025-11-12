'use server';

import { Conversation, ConversationInfo } from '@epam/ai-dial-shared';
import { getBucket } from './bucket';
import { conversationApi, DEFAULT_MODEL_ID } from '../api/api';
import { apiLogger } from '../../core/logger';
import {
  ConversationData,
  CreateConversationRequest,
  GeneratedLinkResponse,
  SharedConversations,
  SharedConversationsRequest,
  UpdateConversationRequest,
} from '@epam/statgpt-dial-toolkit';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { getUserToken } from '../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { ApiResponse, HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';
import { getIsInvalidSession } from '../../utils/auth/is-valid-session';
import { INVALID_SESSION_RESPONSE } from '../../utils/auth/check-session';
import { makeSuccessResponse } from '../../utils/auth/success-response';

const CONVERSATIONS_URL = '/conversations';

export async function getConversations(
  locale?: string,
): Promise<ApiResponse<ConversationInfo[]>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }

    //TODO: update with locales folders logic
    // First get the user's bucket
    const bucketResponse = await getBucket();
    if (!bucketResponse.success || bucketResponse.data == null) {
      if (bucketResponse.statusCode === HTTP_ERROR_CODES.UNAUTHORIZED) {
        return INVALID_SESSION_RESPONSE;
      }
      throw new Error('No bucket data');
    }

    const bucket = bucketResponse.data.bucket;

    // Then fetch conversations for that bucket
    return makeSuccessResponse(
      await conversationApi.getConversations(
        token?.access_token as string,
        bucket,
        locale,
      ),
    );
  } catch (error) {
    apiLogger.error(`Failed to fetch conversations: ${error}`);
    throw new Error('Failed to fetch conversations');
  }
}

export async function getConversation(
  conversationId: string,
): Promise<ApiResponse<Conversation>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }

    const conversation = await conversationApi.getConversation(
      conversationId,
      token?.access_token as string,
    );
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    return makeSuccessResponse(conversation);
  } catch (error) {
    apiLogger.error(`Failed to fetch conversation: ${error}`);
    throw new Error('Failed to fetch conversation');
  }
}

export async function createConversation(
  request: CreateConversationRequest,
): Promise<ApiResponse<ConversationInfo>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    const conversation = await conversationApi.createConversation(
      {
        ...request,
        model: { id: DEFAULT_MODEL_ID },
      },
      token?.access_token as string,
    );
    revalidatePath(CONVERSATIONS_URL);
    return makeSuccessResponse(conversation);
  } catch (error) {
    apiLogger.error(`Failed to create conversation: ${error}`);
    throw new Error('Failed to create conversation');
  }
}

export async function updateConversation(
  conversationId: string,
  request: UpdateConversationRequest,
): Promise<ApiResponse<ConversationInfo>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    const conversation = await conversationApi.updateConversation(
      conversationId,
      request,
      token?.access_token as string,
    );
    return makeSuccessResponse(conversation);
  } catch (error) {
    apiLogger.error(`Failed to update conversation: ${error}`);
    throw new Error('Failed to update conversation');
  }
}

export async function deleteConversation(
  conversation: ConversationInfo,
): Promise<ApiResponse<void>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    await conversationApi.deleteConversation(
      conversation,
      token?.access_token as string,
    );
    revalidatePath(CONVERSATIONS_URL);
    return makeSuccessResponse(void 0);
  } catch (error) {
    apiLogger.error(`Failed to delete conversation: ${error}`);
    throw new Error('Failed to delete conversation');
  }
}

export async function generateConversationLink(
  conversationData?: ConversationData,
): Promise<ApiResponse<GeneratedLinkResponse>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    const link = await conversationApi.generateConversationLink(
      token?.access_token as string,
      conversationData,
    );

    return makeSuccessResponse(link);
  } catch (error) {
    apiLogger.error(`Failed to generate conversation link: ${error}`);
    throw new Error('Failed to generate conversation link');
  }
}

export async function getSharedConversations(
  requestData?: SharedConversationsRequest,
): Promise<ApiResponse<SharedConversations>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    const conversations = await conversationApi.getSharedConversations(
      token?.access_token as string,
      requestData,
    );
    return makeSuccessResponse(conversations);
  } catch (error) {
    apiLogger.error(`Failed to get shared conversations: ${error}`);
    throw new Error('Failed to get shared conversations');
  }
}

export async function revokeSharedConversations(
  sharedConversations?: SharedConversations,
): Promise<ApiResponse<void>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    const res = await conversationApi.revokeSharedConversations(
      token?.access_token as string,
      sharedConversations,
    );
    return makeSuccessResponse(res);
  } catch (error) {
    apiLogger.error(`Failed to revoke shared conversations: ${error}`);
    throw new Error('Failed to revoke shared conversations');
  }
}

export async function rateResponse(
  responseId: string,
  rate: boolean,
): Promise<ApiResponse<void>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    const res = await conversationApi.rateResponse(
      responseId,
      rate,
      token?.access_token as string,
    );
    return makeSuccessResponse(res);
  } catch (error) {
    apiLogger.error(`Failed to rate response: ${error}`);
    throw new Error('Failed to rate response');
  }
}

export async function renameConversation(
  sourceUrl: string,
  destinationUrl: string,
): Promise<ApiResponse<void>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    const res = await conversationApi.renameConversation(
      sourceUrl,
      destinationUrl,
      token?.access_token as string,
    );
    return makeSuccessResponse(res);
  } catch (error) {
    apiLogger.error(`Failed to rename conversation: ${error}`);
    throw new Error('Failed to rename conversation');
  }
}
