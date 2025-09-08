import { AuthOptions, CookiesOptions } from 'next-auth';
import { authProviders } from '@statgpt/shared-toolkit/src/utils/auth/auth-providers';
import { callbacks } from '@statgpt/shared-toolkit/src/utils/auth/auth-callbacks';

// https://github.com/nextauthjs/next-auth/blob/a8dfc8ebb11ccb96fd694db888e52f0d20395e64/packages/core/src/lib/cookie.ts#L53
function defaultCookies(
  useSecureCookies: boolean,
  sameSite = 'lax',
): CookiesOptions {
  const cookiePrefix = useSecureCookies ? '__Secure-' : '';

  return {
    // default cookie options
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
        domain: process.env.COOKIE_DOMAIN || undefined,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
        domain: process.env.COOKIE_DOMAIN || undefined,
      },
    },
    csrfToken: {
      // Default to __Host- for CSRF token for additional protection if using useSecureCookies
      // NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
      name: `${useSecureCookies ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes in seconds
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes in seconds
      },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite,
        path: '/',
        secure: useSecureCookies,
      },
    },
  };
}

const isSecure =
  !!process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('https:');

export const authOptions = {
  providers: authProviders,
  cookies: defaultCookies(isSecure, isSecure ? 'none' : 'lax'),
  callbacks,
  session: {
    strategy: 'jwt',
  },
  debug: true,
} as AuthOptions;
