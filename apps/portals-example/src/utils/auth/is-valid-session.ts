import { DefaultSession, getServerSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { authOptions } from './auth-options';

export const getIsInvalidSession = async (
  isEnableAuth: boolean,
  token: JWT | null,
) => {
  if (!isEnableAuth) {
    return false;
  }
  const session = (await getServerSession(authOptions)) as DefaultSession & {
    error?: string;
  };
  const isInvalidSession = session == null || session.error != null;

  const isTokenInvalid =
    token == null ||
    (typeof token.accessTokenExpires === 'number' &&
      Date.now() > token.accessTokenExpires);

  return isInvalidSession || isTokenInvalid;
};
