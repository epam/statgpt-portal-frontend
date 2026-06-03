describe('getIsEnableAuthToggle', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    // Start from a clean slate so individual tests control the relevant vars,
    // independent of any auth env vars present in the ambient environment.
    delete process.env.NEXTAUTH_URL;
    delete process.env.DIAL_API_KEY;
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('AUTH_')) {
        delete process.env[key];
      }
    }
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  // `hasConfiguredAuthProviders` is evaluated at module load time, so each test
  // sets env vars first and then re-imports the module in isolation.
  const loadToggle = (): (() => boolean) => {
    let getIsEnableAuthToggle!: () => boolean;
    jest.isolateModules(() => {
      getIsEnableAuthToggle =
        require('../get-auth-toggle').getIsEnableAuthToggle;
    });
    return getIsEnableAuthToggle;
  };

  const configureKeycloak = (): void => {
    process.env.AUTH_KEYCLOAK_CLIENT_ID = 'client-id';
    process.env.AUTH_KEYCLOAK_SECRET = 'secret';
    process.env.AUTH_KEYCLOAK_HOST = 'https://keycloak.example.com';
  };

  it('enables auth when a provider is configured and NEXTAUTH_URL is set', () => {
    process.env.NEXTAUTH_URL = 'http://localhost:4001';
    configureKeycloak();

    expect(loadToggle()()).toBe(true);
  });

  it('keeps auth enabled even when DIAL_API_KEY is also set', () => {
    process.env.NEXTAUTH_URL = 'http://localhost:4001';
    process.env.DIAL_API_KEY = 'dial-api-key';
    configureKeycloak();

    // Regression: DIAL_API_KEY must no longer take precedence over a
    // configured auth provider.
    expect(loadToggle()()).toBe(true);
  });

  it('disables auth when no provider is configured', () => {
    process.env.NEXTAUTH_URL = 'http://localhost:4001';
    process.env.DIAL_API_KEY = 'dial-api-key';

    expect(loadToggle()()).toBe(false);
  });

  it('disables auth when a provider is configured but NEXTAUTH_URL is missing', () => {
    configureKeycloak();

    expect(loadToggle()()).toBe(false);
  });
});
