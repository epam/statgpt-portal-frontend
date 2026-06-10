import { customFetch } from 'next-auth';
import { Provider } from 'next-auth/providers/index';
import Auth0Provider from 'next-auth/providers/auth0';
import AzureProvider from 'next-auth/providers/azure-ad';
import CognitoProvider from 'next-auth/providers/cognito';
import GoogleProvider from 'next-auth/providers/google';
import KeycloakProvider from 'next-auth/providers/keycloak';
import OktaProvider from 'next-auth/providers/okta';
import AzureB2CProvider from 'next-auth/providers/azure-ad-b2c';

import { GitLab } from './custom-gitlab';
import PingId from './ping-identity';
import {
  isAuth0Configured,
  isAzureAdConfigured,
  isAzureB2cConfigured,
  isCognitoConfigured,
  isGitlabConfigured,
  isGoogleConfigured,
  isKeycloakConfigured,
  isOktaConfigured,
  isPingIdConfigured,
} from './auth-providers-config';

const DEFAULT_NAME = 'SSO';

const getAzureAdIssuer = () => {
  const tenantId = process.env.AUTH_AZURE_AD_TENANT_ID || 'common';
  return `https://login.microsoftonline.com/${tenantId}/v2.0`;
};

const getAzureB2cIssuer = () => {
  if (process.env.AUTH_AZURE_B2C_ISSUER) {
    return process.env.AUTH_AZURE_B2C_ISSUER;
  }

  const tenantId = process.env.AUTH_AZURE_B2C_TENANT_ID;
  const userFlow = process.env.AUTH_AZURE_B2C_USER_FLOW;

  if (!tenantId || !userFlow) {
    return undefined;
  }

  return `https://${tenantId}.b2clogin.com/${tenantId}.onmicrosoft.com/${userFlow}/v2.0`;
};

/**
 * Azure AD B2C custom policies omit `userinfo_endpoint` from their discovery
 * document, but `@auth/core` rejects metadata without one — even though it
 * never calls userinfo for the OIDC id_token flow.
 */
const b2cDiscoveryFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);

  const url = new URL(input instanceof Request ? input.url : input.toString());
  if (!url.pathname.endsWith('/.well-known/openid-configuration')) {
    return response;
  }

  const metadata = await response.clone().json();
  if (!metadata?.issuer || metadata.userinfo_endpoint) {
    return response;
  }

  return Response.json({
    ...metadata,
    userinfo_endpoint: `${metadata.issuer}userinfo`,
  });
};

const allProviders: (Provider | boolean)[] = [
  isAzureAdConfigured &&
    AzureProvider({
      clientId: process.env.AUTH_AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AUTH_AZURE_AD_SECRET!,
      issuer: process.env.AUTH_AZURE_AD_ISSUER ?? getAzureAdIssuer(),
      name: process.env.AUTH_AZURE_AD_NAME ?? DEFAULT_NAME,
      authorization: {
        params: {
          scope:
            process.env.AUTH_AZURE_AD_SCOPE ||
            'openid profile user.Read email offline_access',
        },
      },
    }),

  isAzureB2cConfigured &&
    AzureB2CProvider({
      issuer: getAzureB2cIssuer(),
      clientId: process.env.AUTH_AZURE_B2C_CLIENT_ID!,
      clientSecret: process.env.AUTH_AZURE_B2C_CLIENT_SECRET!,
      name: process.env.AUTH_AZURE_B2C_NAME ?? DEFAULT_NAME,
      authorization: {
        params: {
          scope:
            process.env.AUTH_AZURE_B2C_SCOPE ||
            'openid profile user.Read email offline_access',
        },
      },
      [customFetch]: b2cDiscoveryFetch,
    }),

  isGitlabConfigured &&
    GitLab({
      clientId: process.env.AUTH_GITLAB_CLIENT_ID!,
      clientSecret: process.env.AUTH_GITLAB_SECRET!,
      name: process.env.AUTH_GITLAB_NAME ?? DEFAULT_NAME,
      gitlabHost: process.env.AUTH_GITLAB_HOST,
      authorization: {
        params: { scope: process.env.AUTH_GITLAB_SCOPE || 'read_user' },
      },
    }),

  isGoogleConfigured &&
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      name: process.env.AUTH_GOOGLE_NAME ?? DEFAULT_NAME,
      authorization: {
        params: {
          scope:
            process.env.AUTH_GOOGLE_SCOPE ||
            'openid email profile offline_access',
        },
      },
    }),

  isAuth0Configured &&
    Auth0Provider({
      clientId: process.env.AUTH_AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH_AUTH0_SECRET!,
      name: process.env.AUTH_AUTH0_NAME ?? DEFAULT_NAME,
      issuer: process.env.AUTH_AUTH0_HOST,
      authorization: {
        params: {
          audience: process.env.AUTH_AUTH0_AUDIENCE,
          scope:
            process.env.AUTH_AUTH0_SCOPE ||
            'openid email profile offline_access',
        },
      },
    }),

  isKeycloakConfigured &&
    KeycloakProvider({
      clientId: process.env.AUTH_KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      name: process.env.AUTH_KEYCLOAK_NAME ?? DEFAULT_NAME,
      issuer: process.env.AUTH_KEYCLOAK_HOST,
      authorization: {
        params: {
          scope:
            process.env.AUTH_KEYCLOAK_SCOPE ||
            'openid email profile offline_access',
        },
      },
    }),

  isPingIdConfigured &&
    PingId({
      clientId: process.env.AUTH_PING_ID_CLIENT_ID!,
      clientSecret: process.env.AUTH_PING_ID_SECRET!,
      name: process.env.AUTH_PING_ID_NAME ?? DEFAULT_NAME,
      issuer: process.env.AUTH_PING_ID_HOST,
      authorization: {
        params: {
          scope: process.env.AUTH_PING_ID_SCOPE || 'offline_access',
        },
      },
    }),

  isCognitoConfigured &&
    CognitoProvider({
      clientId: process.env.AUTH_COGNITO_CLIENT_ID!,
      clientSecret: process.env.AUTH_COGNITO_SECRET!,
      issuer: process.env.AUTH_COGNITO_HOST,
      name: process.env.AUTH_COGNITO_NAME ?? DEFAULT_NAME,
      authorization: {
        params: {
          scope: process.env.AUTH_COGNITO_SCOPE || 'openid email profile',
        },
      },
    }),

  isOktaConfigured &&
    OktaProvider({
      clientId: process.env.AUTH_OKTA_CLIENT_ID!,
      clientSecret: process.env.AUTH_OKTA_CLIENT_SECRET!,
      issuer: process.env.AUTH_OKTA_ISSUER,
      authorization: {
        params: {
          scope: process.env.AUTH_OKTA_SCOPE || 'openid email profile',
        },
      },
    }),
];

export const authProviders = allProviders.filter(Boolean) as Provider[];

/**
 * Is authorization enabled
 *
 * Use only in server context
 *
 * @type {boolean}
 */
export const isAuthDisabled = authProviders.length === 0;
