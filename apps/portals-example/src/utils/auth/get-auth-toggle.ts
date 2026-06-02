import { hasConfiguredAuthProviders } from './auth-providers-config';

/**
 * Whether authentication (NextAuth/JWT) is enabled for the deployment.
 *
 * Auth is enabled when an auth provider is configured and `NEXTAUTH_URL` is set.
 */
export const getIsEnableAuthToggle = (): boolean => {
  return !!process.env.NEXTAUTH_URL && hasConfiguredAuthProviders;
};
