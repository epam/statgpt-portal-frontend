import { TokenSet } from '@auth/core/types';

type RefreshProviderConfig = {
  clientId?: string;
  clientSecret?: string;
  issuer?: string;
  tokenEndpoint?: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

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

const getRefreshProviderConfig = (
  providerId: string,
): RefreshProviderConfig | undefined => {
  switch (providerId) {
    case 'azure-ad':
      return {
        clientId: process.env.AUTH_AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AUTH_AZURE_AD_SECRET,
        issuer: process.env.AUTH_AZURE_AD_ISSUER ?? getAzureAdIssuer(),
      };
    case 'azure-ad-b2c':
      return {
        clientId: process.env.AUTH_AZURE_B2C_CLIENT_ID,
        clientSecret: process.env.AUTH_AZURE_B2C_CLIENT_SECRET,
        issuer: getAzureB2cIssuer(),
      };
    case 'gitlab': {
      const host = trimTrailingSlash(
        process.env.AUTH_GITLAB_HOST ?? 'https://gitlab.com',
      );
      return {
        clientId: process.env.AUTH_GITLAB_CLIENT_ID,
        clientSecret: process.env.AUTH_GITLAB_SECRET,
        tokenEndpoint: `${host}/oauth/token`,
      };
    }
    case 'google':
      return {
        clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };
    case 'auth0':
      return {
        clientId: process.env.AUTH_AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH_AUTH0_SECRET,
        issuer: process.env.AUTH_AUTH0_HOST,
      };
    case 'keycloak':
      return {
        clientId: process.env.AUTH_KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
        issuer: process.env.AUTH_KEYCLOAK_HOST,
      };
    case 'ping-id':
      return {
        clientId: process.env.AUTH_PING_ID_CLIENT_ID,
        clientSecret: process.env.AUTH_PING_ID_SECRET,
        issuer: process.env.AUTH_PING_ID_HOST,
      };
    case 'cognito':
      return {
        clientId: process.env.AUTH_COGNITO_CLIENT_ID,
        clientSecret: process.env.AUTH_COGNITO_SECRET,
        issuer: process.env.AUTH_COGNITO_HOST,
      };
    case 'okta':
      return {
        clientId: process.env.AUTH_OKTA_CLIENT_ID,
        clientSecret: process.env.AUTH_OKTA_CLIENT_SECRET,
        issuer: process.env.AUTH_OKTA_ISSUER,
      };
    default:
      return undefined;
  }
};

const discoverTokenEndpoint = async (issuer: string) => {
  const response = await fetch(
    `${trimTrailingSlash(issuer)}/.well-known/openid-configuration`,
  );

  if (!response.ok) {
    throw new Error(`Failed to discover token endpoint for issuer ${issuer}`);
  }

  const metadata = (await response.json()) as { token_endpoint?: string };

  if (!metadata.token_endpoint) {
    throw new Error(`Token endpoint is missing for issuer ${issuer}`);
  }

  return metadata.token_endpoint;
};

export const refreshOAuthToken = async (
  providerId: string,
  refreshToken: string,
): Promise<TokenSet> => {
  const config = getRefreshProviderConfig(providerId);

  if (!config?.clientId || !config.clientSecret) {
    throw new Error(`Refresh provider ${providerId} is not configured`);
  }

  const tokenEndpoint =
    config.tokenEndpoint ??
    (config.issuer ? await discoverTokenEndpoint(config.issuer) : undefined);

  if (!tokenEndpoint) {
    throw new Error(`Token endpoint is not configured for ${providerId}`);
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const tokens = (await response.json()) as TokenSet & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(
      tokens.error_description ??
        tokens.error ??
        `Failed to refresh ${providerId} access token`,
    );
  }

  if (!tokens.expires_at && tokens.expires_in) {
    tokens.expires_at = Math.floor(Date.now() / 1000) + tokens.expires_in;
  }

  return tokens;
};
