export const isAzureAdConfigured =
  !!process.env.AUTH_AZURE_AD_CLIENT_ID &&
  !!process.env.AUTH_AZURE_AD_SECRET &&
  !!process.env.AUTH_AZURE_AD_TENANT_ID;

export const isAzureB2cConfigured =
  !!process.env.AUTH_AZURE_B2C_CLIENT_ID &&
  !!process.env.AUTH_AZURE_B2C_CLIENT_SECRET &&
  !!process.env.AUTH_AZURE_B2C_TENANT_ID;

export const isGitlabConfigured =
  !!process.env.AUTH_GITLAB_CLIENT_ID && !!process.env.AUTH_GITLAB_SECRET;

export const isGoogleConfigured =
  !!process.env.AUTH_GOOGLE_CLIENT_ID && !!process.env.AUTH_GOOGLE_SECRET;

export const isAuth0Configured =
  !!process.env.AUTH_AUTH0_CLIENT_ID &&
  !!process.env.AUTH_AUTH0_SECRET &&
  !!process.env.AUTH_AUTH0_HOST;

export const isKeycloakConfigured =
  !!process.env.AUTH_KEYCLOAK_CLIENT_ID &&
  !!process.env.AUTH_KEYCLOAK_SECRET &&
  !!process.env.AUTH_KEYCLOAK_HOST;

export const isPingIdConfigured =
  !!process.env.AUTH_PING_ID_CLIENT_ID &&
  !!process.env.AUTH_PING_ID_SECRET &&
  !!process.env.AUTH_PING_ID_HOST;

export const isCognitoConfigured =
  !!process.env.AUTH_COGNITO_CLIENT_ID &&
  !!process.env.AUTH_COGNITO_SECRET &&
  !!process.env.AUTH_COGNITO_HOST;

export const isOktaConfigured =
  !!process.env.AUTH_OKTA_CLIENT_SECRET &&
  !!process.env.AUTH_OKTA_CLIENT_ID &&
  !!process.env.AUTH_OKTA_ISSUER;

/**
 * `true` when at least one auth provider is fully configured.
 */
export const hasConfiguredAuthProviders =
  isAzureAdConfigured ||
  isAzureB2cConfigured ||
  isGitlabConfigured ||
  isGoogleConfigured ||
  isAuth0Configured ||
  isKeycloakConfigured ||
  isPingIdConfigured ||
  isCognitoConfigured ||
  isOktaConfigured;
