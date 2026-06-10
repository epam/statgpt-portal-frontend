import { getToken, GetTokenParams, JWT } from 'next-auth/jwt';
import { getAuthSecret, getSessionCookieName } from './auth-cookie';

export const getTokenRequest = async (
  headers: Promise<Headers>,
  cookies: Promise<unknown>,
): Promise<GetTokenParams> => {
  const headersList = await headers;
  await cookies;

  return {
    req: {
      headers: headersList,
    },
    cookieName: getSessionCookieName(),
    secret: getAuthSecret(),
  };
};

export const getUserToken = async (
  isEnableAuth: boolean,
  headers: Promise<Headers>,
  cookies: Promise<unknown>,
): Promise<JWT | null> => {
  return isEnableAuth
    ? await getToken(await getTokenRequest(headers, cookies))
    : null;
};
