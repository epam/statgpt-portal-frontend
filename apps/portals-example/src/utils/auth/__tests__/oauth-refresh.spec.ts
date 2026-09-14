import { refreshOAuthToken, OAuthRefreshError } from '../oauth-refresh';

const jsonResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

// azure-ad-b2c has no direct tokenEndpoint in getRefreshProviderConfig, so
// refreshOAuthToken always calls discoverTokenEndpoint() first — every test
// that reaches the token exchange must mock two sequential fetch calls:
// (1) the .well-known discovery request, (2) the token exchange itself.
const DISCOVERY_RESPONSE = jsonResponse(200, {
  token_endpoint: 'https://tenant.b2clogin.com/tenant/flow/oauth2/v2.0/token',
});

const mockTokenExchange = (exchangeResponse: Response) => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce(DISCOVERY_RESPONSE)
    .mockResolvedValueOnce(exchangeResponse);
};

describe('refreshOAuthToken', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.AUTH_AZURE_B2C_CLIENT_ID = 'client-id';
    process.env.AUTH_AZURE_B2C_CLIENT_SECRET = 'client-secret';
    process.env.AUTH_AZURE_B2C_ISSUER =
      'https://tenant.b2clogin.com/tenant/flow/v2.0';
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns the parsed token set on a successful response', async () => {
    mockTokenExchange(
      jsonResponse(200, {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      }),
    );

    const result = await refreshOAuthToken('azure-ad-b2c', 'old-refresh-token');

    expect(result.access_token).toBe('new-access-token');
    expect(result.refresh_token).toBe('new-refresh-token');
  });

  it('computes expires_at from expires_in when the provider omits expires_at', async () => {
    const now = Date.now();
    mockTokenExchange(
      jsonResponse(200, { access_token: 'a', expires_in: 100 }),
    );

    const result = await refreshOAuthToken('azure-ad-b2c', 'old-refresh-token');

    expect(result.expires_at).toBeGreaterThanOrEqual(
      Math.floor(now / 1000) + 100,
    );
  });

  it('passes an abort signal to both the discovery and token-exchange fetch calls', async () => {
    mockTokenExchange(
      jsonResponse(200, { access_token: 'a', expires_in: 100 }),
    );

    await refreshOAuthToken('azure-ad-b2c', 'old-refresh-token');

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(calls[1][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('throws an OAuthRefreshError carrying the provider error code for invalid_grant', async () => {
    mockTokenExchange(
      jsonResponse(400, {
        error: 'invalid_grant',
        error_description:
          'AADB2C90085: The service has encountered an internal error.',
      }),
    );

    await expect(
      refreshOAuthToken('azure-ad-b2c', 'old-refresh-token'),
    ).rejects.toMatchObject({
      code: 'invalid_grant',
    });
  });

  it('throws an OAuthRefreshError with no code when the response carries none', async () => {
    mockTokenExchange(jsonResponse(500, {}));

    let caught: unknown;
    try {
      await refreshOAuthToken('azure-ad-b2c', 'old-refresh-token');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthRefreshError);
    expect((caught as OAuthRefreshError).code).toBeUndefined();
  });

  it('throws when the provider config is missing a clientId/clientSecret', async () => {
    delete process.env.AUTH_AZURE_B2C_CLIENT_SECRET;

    // No fetch call is expected here — the config check throws before any
    // network request, so `global.fetch` is never invoked in this test.
    await expect(
      refreshOAuthToken('azure-ad-b2c', 'old-refresh-token'),
    ).rejects.toThrow('not configured');
  });
});
