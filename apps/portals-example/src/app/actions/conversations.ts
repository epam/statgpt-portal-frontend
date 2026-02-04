'use server';

import { conversationApi } from '../api/api';
import { apiLogger } from '../../core/logger';
import {
  ConversationData,
  GeneratedLinkResponse,
  SharedConversations,
  SharedConversationsRequest,
} from '@epam/statgpt-dial-toolkit';
import { cookies, headers } from 'next/headers';
import { getUserToken } from '../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { getIsInvalidSession } from '../../utils/auth/is-valid-session';
import { INVALID_SESSION_RESPONSE } from '../../utils/auth/check-session';
import { makeSuccessResponse } from '../../utils/auth/success-response';

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
