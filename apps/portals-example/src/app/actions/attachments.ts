'use server';

import { conversationApi } from '../api/api';
import { apiLogger } from '../../core/logger';
import { GridAttachmentContent } from '@epam/statgpt-dial-toolkit';
import { cookies, headers } from 'next/headers';
import { getUserToken } from '../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { getIsInvalidSession } from '../../utils/auth';
import { INVALID_SESSION_RESPONSE } from '../../utils/auth/check-session';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { makeSuccessResponse } from '../../utils/auth/success-response';

export async function getFile(
  filePath: string,
): Promise<ApiResponse<GridAttachmentContent | null>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }

    const file = await conversationApi.getFile(
      filePath,
      token?.access_token as string,
    );
    return makeSuccessResponse(file);
  } catch (error) {
    apiLogger.error(`Failed to fetch file: ${error}`);
    throw new Error('Failed to fetch file');
  }
}

export async function getFileBlob(
  filePath: string,
): Promise<ApiResponse<Blob>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }

    const blob = (await conversationApi.getFileBlob(
      filePath,
      token?.access_token as string,
    )) as Blob;
    return makeSuccessResponse(blob);
  } catch (error) {
    apiLogger.error(`Failed to fetch file: ${error}`);
    throw new Error('Failed to fetch file');
  }
}
