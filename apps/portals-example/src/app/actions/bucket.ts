'use server';

import { dialApiClient } from '../api/api';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { cookies, headers } from 'next/headers';
import { getUserToken } from '../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { getIsInvalidSession } from '../../utils/auth';
import { INVALID_SESSION_RESPONSE } from '../../utils/auth/check-session';
import { makeSuccessResponse } from '../../utils/auth/success-response';

export async function getBucket(): Promise<ApiResponse<{ bucket: string }>> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    const bucket = await dialApiClient.getRequest<{ bucket: string }>(
      DIAL_API_ROUTES.BUCKET,
      token?.access_token as string,
    );
    return makeSuccessResponse(bucket);
  } catch (error) {
    console.error('Failed to fetch bucket:', error);
    throw new Error('Failed to fetch user bucket');
  }
}
