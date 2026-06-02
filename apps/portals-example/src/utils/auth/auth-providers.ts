import { Provider, TokenEndpointHandler } from 'next-auth/providers/index';
import Auth0Provider from 'next-auth/providers/auth0';
import AzureProvider from 'next-auth/providers/azure-ad';
import CognitoProvider from 'next-auth/providers/cognito';
import GoogleProvider from 'next-auth/providers/google';
import KeycloakProvider from 'next-auth/providers/keycloak';
import OktaProvider from 'next-auth/providers/okta';
import AzureB2CProvider from 'next-auth/providers/azure-ad-b2c';

import { GitLab } from './custom-gitlab';
import PingId from './ping-identity';
import NextClient from './nextauth-client';
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

// Need to be set for all providers
export const tokenConfig: TokenEndpointHandler = {
  request: async (context) => {
    let tokens;

    NextClient.setClient(context.client, context.provider);

    if (context.provider.idToken) {
      tokens = await context.client.callback(
        context.provider.callbackUrl,
        context.params,
        context.checks,
      );
    } else {
      tokens = await context.client.oauthCallback(
        context.provider.callbackUrl,
        context.params,
        context.checks,
      );
    }
    return { tokens };
  },
};

const DEFAULT_NAME = 'SSO';

const allProviders: (Provider | boolean)[] = [
  isAzureAdConfigured &&
    AzureProvider({
      clientId: process.env.AUTH_AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AUTH_AZURE_AD_SECRET!,
      tenantId: process.env.AUTH_AZURE_AD_TENANT_ID,
      name: process.env.AUTH_AZURE_AD_NAME ?? DEFAULT_NAME,
      authorization: {
        params: {
          scope:
            process.env.AUTH_AZURE_AD_SCOPE ||
            'openid profile user.Read email offline_access',
        },
      },
      token: tokenConfig,
    }),

  isAzureB2cConfigured &&
    AzureB2CProvider({
      issuer: process.env.AUTH_AZURE_B2C_ISSUER,
      clientId: process.env.AUTH_AZURE_B2C_CLIENT_ID!,
      clientSecret: process.env.AUTH_AZURE_B2C_CLIENT_SECRET!,
      tenantId: process.env.AUTH_AZURE_B2C_TENANT_ID,
      name: process.env.AUTH_AZURE_B2C_NAME ?? DEFAULT_NAME,
      primaryUserFlow: process.env.AUTH_AZURE_B2C_USER_FLOW,
      authorization: {
        params: {
          scope:
            process.env.AUTH_AZURE_B2C_SCOPE ||
            'openid profile user.Read email offline_access',
        },
      },
      token: tokenConfig,
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
      token: tokenConfig,
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
      token: tokenConfig,
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
      token: tokenConfig,
    }),

  isKeycloakConfigured &&
    KeycloakProvider({
      clientId: process.env.AUTH_KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      name: process.env.AUTH_KEYCLOAK_NAME ?? DEFAULT_NAME,
      issuer: process.env.AUTH_KEYCLOAK_HOST,
      userinfo: {
        async request(context) {
          const userinfo = await context.client.userinfo(
            context.tokens.access_token as string,
          );
          return userinfo;
        },
      },
      authorization: {
        params: {
          scope:
            process.env.AUTH_KEYCLOAK_SCOPE ||
            'openid email profile offline_access',
        },
      },
      token: tokenConfig,
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
      token: tokenConfig,
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
      token: tokenConfig,
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
      token: tokenConfig,
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
