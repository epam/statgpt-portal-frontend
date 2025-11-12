import { JWT } from 'next-auth/jwt';

export const logTokenExpiration = (
  token: JWT | undefined | null,
  logMsg = 'in jwt callback',
): void => {
  console.info(
    {
      expiresIn: token?.expires_in,
      expiresAt: token?.expires_at,
      expires: token?.expires_in
        ? Date.now() + (token.expires_in as number) * 1000
        : (token?.expires_at as number) * 1000,
    },
    logMsg,
  );
};
