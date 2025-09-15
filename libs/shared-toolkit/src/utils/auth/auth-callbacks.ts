import { decodeJwt } from 'jose';
import { get } from 'lodash';
import { Account, CallbacksOptions, Profile } from 'next-auth';
import { TokenSet } from 'openid-client';
import { Token, UserSession } from '@statgpt/shared-toolkit/src/models/auth';
import NextClient, {
  RefreshToken,
} from '@statgpt/shared-toolkit/src/utils/auth/nextauth-client';

const waitRefreshTokenTimeout = 5;

const REFRESH_TOKEN_THRESHOLD = 32 * 60 * 1000; // 32 minutes

const safeDecodeJwt = (accessToken: string) => {
  try {
    return decodeJwt(accessToken);
  } catch (err) {
    console.error("Token couldn't be parsed as JWT", err);
    // TODO: read roles from GCP token format
    return {};
  }
};

const getUser = (accessToken?: string) => {
  const rolesFieldName = process.env.DIAL_ROLES_FIELD ?? 'dial_roles';
  const decodedPayload = accessToken ? safeDecodeJwt(accessToken) : {};
  const adminRoleNames = (process.env.ADMIN_ROLE_NAMES || 'admin').split(',');
  const dialRoles = get(decodedPayload, rolesFieldName, []) as string[];
  const roles = Array.isArray(dialRoles) ? dialRoles : [dialRoles];
  const isAdmin =
    roles.length > 0 && adminRoleNames.some((role) => roles.includes(role));

  return {
    isAdmin,
  };
};

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
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const refresh = NextClient.getRefreshToken(token.userId);
      if (!refresh || !refresh.isRefreshing) {
        const localToken: RefreshToken = refresh || {
          isRefreshing: true,
          token,
        };
        if (
          typeof localToken.token?.accessTokenExpires === 'number' &&
          Date.now() <
            localToken.token.accessTokenExpires - REFRESH_TOKEN_THRESHOLD
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

    const returnToken = {
      ...token,
      user: getUser(refreshedTokens.access_token),
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
    const timeLeft =
      typeof options.token.accessTokenExpires === 'number' &&
      options.token.accessTokenExpires - Date.now();

    if (options.account) {
      return {
        ...options.token,
        user: getUser(options.account?.access_token),
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

    // Calculate remaining time until the access token expires

    if (timeLeft && timeLeft > REFRESH_TOKEN_THRESHOLD) {
      return {
        ...options.token,
        user: getUser(options.token.access_token as string),
      };
    }
    const typedToken = options.token as Token;
    const refreshedToken = await refreshAccessToken(typedToken);
    return { ...refreshedToken, isNew: true };
  },
  signIn: async (options) => {
    if (!options.account?.access_token) {
      return false;
    }

    return true;
  },
  session: async (options) => {
    // Pass any token errors to the session
    if (options.token?.error) {
      if (options.session) {
        (options.session as UserSession).error = options.token.error;
      }
    }

    const isAdmin =
      (options?.token?.user as { isAdmin?: boolean })?.isAdmin ?? false;

    if (options.session.user) {
      (options?.session?.user as { isAdmin?: boolean }).isAdmin = isAdmin;
    }

    return options.session;
  },
};
