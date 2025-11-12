import { getUserToken } from './auth-request';
import { getIsEnableAuthToggle } from './get-auth-toggle';
import { cookies, headers } from 'next/headers';
import { getIsInvalidSession } from './is-valid-session';
import { HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';

export const checkSessionInvalid = async () => {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  return await getIsInvalidSession(isEnableAuth, token);
};

export const INVALID_SESSION_RESPONSE = {
  success: false,
  statusCode: HTTP_ERROR_CODES.UNAUTHORIZED,
};
