/* eslint-disable no-console */
import { Account, CallbacksOptions, Profile } from 'next-auth';

import { TokenSet } from 'openid-client';
import { Token, UserSession } from '../../models/auth';
import { logTokenExpiration } from './log-token-info';
import NextClient, { RefreshToken } from './nextauth-client';

const waitRefreshTokenTimeout = 5;

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: Token) {
  const displayedTokenSub =
    process.env.SHOW_TOKEN_SUB === 'true' ? token.sub : '******';

  try {
    // Ensure the token contains provider information
    if (!token.providerId) {
      throw new Error(`No provider information exists in token`);
    }

    const client = NextClient.getClient(token.providerId);

    if (!client) {
      console.error(
        `No client for provider: ${token.providerId}. Sub: ${displayedTokenSub}`,
      );
      return {
        ...token,
        error: 'NoClientForProvider',
      };
    }

    let msWaiting = 0;

    while (true) {
      const refresh = NextClient.getRefreshToken(token.userId);
      if (!refresh || !refresh.isRefreshing) {
        const localToken: RefreshToken = refresh || {
          isRefreshing: true,
          token,
        };
        console.log(
          `Refreshing token: expires - ${new Date(Number(localToken.token?.accessTokenExpires))}, now - ${new Date(
            Date.now(),
          )}`,
        );
        if (
          typeof localToken.token?.accessTokenExpires === 'number' &&
          Date.now() < localToken.token.accessTokenExpires
        ) {
          return localToken.token;
        }

        NextClient.setIsRefreshTokenStart(token.userId, localToken);
        break;
      }

      await NextClient.delay();
      msWaiting += 50;

      if (msWaiting >= waitRefreshTokenTimeout * 1000) {
        throw new Error(
          `Waiting more than ${waitRefreshTokenTimeout} seconds for refreshing token`,
        );
      }
    }
    console.log('refreshing token');
    const refreshedTokens = await client.refresh(
      token.refreshToken as string | TokenSet,
    );

    if (
      !refreshedTokens ||
      (!refreshedTokens.expires_in && !refreshedTokens.expires_at)
    ) {
      throw new Error(`Error from auth provider while refreshing token`);
    }

    if (!refreshedTokens.refresh_token) {
      console.warn(
        `Auth provider didn't provide new refresh token. Sub: ${displayedTokenSub}`,
      );
    }

    if (!refreshedTokens.refresh_token && !token.refreshToken) {
      throw new Error('No refresh tokens exists');
    }

    logTokenExpiration(refreshedTokens, 'in refreshAccessToken callback');
    const returnToken = {
      ...token,
      access_token: refreshedTokens.access_token,
      accessTokenExpires: refreshedTokens.expires_in
        ? Date.now() + refreshedTokens.expires_in * 1000
        : (refreshedTokens.expires_at as number) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };

    NextClient.setIsRefreshTokenStart(token.userId, {
      isRefreshing: false,
      token: returnToken,
    });
    return returnToken;
  } catch (error: unknown) {
    console.error(
      (error as Error).message,
      `Error when refreshing token: ${(error as Error).message}. Sub: ${displayedTokenSub}`,
    );

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const callbacks: Partial<
  CallbacksOptions<Profile & { job_title?: string }, Account>
> = {
  jwt: async (options) => {
    if (options.account) {
      return {
        ...options.token,
        jobTitle: options.profile?.job_title,
        access_token: options.account.access_token,
        accessTokenExpires:
          typeof options.account.expires_in === 'number'
            ? Date.now() + options.account.expires_in * 1000
            : (options.account.expires_at as number) * 1000,
        refreshToken: options.account.refresh_token,
        providerId: options.account.provider,
        userId: options.user.id,
        idToken: options.account.id_token,
      };
    }

    // Return previous token if the access token has not expired yet
    if (
      options.token.providerId === 'credentials' ||
      (typeof options.token.accessTokenExpires === 'number' &&
        Date.now() < options.token.accessTokenExpires)
    ) {
      return {
        ...options.token,
      };
    }

    const typedToken = options.token as Token;
    const refreshedToken = await refreshAccessToken(typedToken);

    const newToken = { ...refreshedToken, isNew: true };

    if ((newToken as { error?: string }).error) {
      console.error(
        (newToken as { error?: string }).error,
        `Error during token refresh`,
      );
    } else {
      console.info('refreshed token');
    }
    return { ...newToken };
  },
  signIn: async (options) => {
    if (!options.account?.access_token) {
      return false;
    }

    return true;
  },
  session: async (options) => {
    if (options.token?.error) {
      console.info(`Session error: ${options.token.error}`);
      (options.session as UserSession).error = options.token.error;
    }

    return options.session;
  },
};
