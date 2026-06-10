import { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { auth } from '../../auth';

export const getIsInvalidSession = async (
  isEnableAuth: boolean,
  token: JWT | null,
) => {
  if (!isEnableAuth) {
    return false;
  }
  const session = (await auth()) as DefaultSession & {
    error?: string;
  };
  const isInvalidSession = session == null || session.error != null;

  const isTokenInvalid =
    token == null ||
    (typeof token.accessTokenExpires === 'number' &&
      Date.now() > token.accessTokenExpires);

  return isInvalidSession || isTokenInvalid;
};
