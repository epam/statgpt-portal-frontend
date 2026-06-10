/**
 * Cookie name and secret resolution shared between the NextAuth config
 * (`auth-options.ts`) and the Edge middleware (`proxy.ts`).
 *
 * This module is deliberately free of any provider/callback imports so it can
 * be pulled into the Edge runtime without dragging the whole auth graph
 * (providers, callbacks, token refresh) into the middleware bundle.
 */

const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;

/** Whether the deployment is served over HTTPS, which gates secure cookies. */
export const isSecureAuthUrl = !!authUrl && authUrl.startsWith('https:');

export const getAuthSecret = () =>
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

/**
 * Session cookie name. Must stay in sync with `sessionToken.name` produced by
 * `defaultCookies()` in `auth-options.ts` — both mirror NextAuth's default of
 * `next-auth.session-token` with the `__Secure-` prefix on HTTPS.
 */
export const getSessionCookieName = () =>
  `${isSecureAuthUrl ? '__Secure-' : ''}next-auth.session-token`;
