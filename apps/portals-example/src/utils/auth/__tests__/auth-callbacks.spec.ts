import { refreshAccessToken } from '../auth-callbacks';
import NextClient from '../nextauth-client';
import { refreshOAuthToken, OAuthRefreshError } from '../oauth-refresh';
import type { Token } from '../../../models/auth';

jest.mock('../oauth-refresh', () => ({
  ...jest.requireActual('../oauth-refresh'),
  refreshOAuthToken: jest.fn(),
}));

const mockRefreshOAuthToken = refreshOAuthToken as jest.Mock;

const baseToken = (overrides: Partial<Token> = {}): Token =>
  ({
    providerId: 'azure-ad-b2c',
    userId: 'user-1',
    refreshToken: 'old-refresh-token',
    accessTokenExpires: Date.now() - 1000,
    sub: 'user-1',
    ...overrides,
  }) as Token;

describe('refreshAccessToken', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)._refreshTokenMap = {};
    mockRefreshOAuthToken.mockReset();
  });

  describe('lock handling', () => {
    it('acquires the lock for the user before calling refreshOAuthToken', async () => {
      let lockDuringCall: boolean | undefined;
      mockRefreshOAuthToken.mockImplementation(async () => {
        lockDuringCall = NextClient.getRefreshToken('user-1')?.isRefreshing;
        return { access_token: 'a', expires_in: 3600 };
      });

      await refreshAccessToken(baseToken());

      expect(lockDuringCall).toBe(true);
    });

    it('releases the lock when refreshOAuthToken throws', async () => {
      mockRefreshOAuthToken.mockRejectedValue(new Error('network blip'));

      await refreshAccessToken(baseToken());

      expect(NextClient.getRefreshToken('user-1')?.isRefreshing).toBe(false);
    });

    it('releases the lock when refreshOAuthToken resolves with a token missing both expires_in and expires_at', async () => {
      mockRefreshOAuthToken.mockResolvedValue({ access_token: 'a' });

      await refreshAccessToken(baseToken());

      expect(NextClient.getRefreshToken('user-1')?.isRefreshing).toBe(false);
    });

    it('does not hang on the wait loop for a second call made after a first call failed', async () => {
      mockRefreshOAuthToken.mockRejectedValueOnce(new Error('network blip'));
      await refreshAccessToken(baseToken());

      mockRefreshOAuthToken.mockResolvedValueOnce({
        access_token: 'fresh-access-token',
        refresh_token: 'fresh-refresh-token',
        expires_in: 3600,
      });
      const second = await refreshAccessToken(baseToken());

      expect((second as { error?: string }).error).toBeUndefined();
      expect((second as { access_token?: string }).access_token).toBe(
        'fresh-access-token',
      );
    });

    it('returns the cached token without calling refreshOAuthToken when it has not expired yet', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any)._refreshTokenMap['user-1'] = {
        isRefreshing: false,
        token: baseToken({ accessTokenExpires: Date.now() + 60_000 }),
      };

      await refreshAccessToken(baseToken());

      expect(mockRefreshOAuthToken).not.toHaveBeenCalled();
    });

    it('serializes two concurrent calls for the same user on a fresh (never-refreshed) lock', async () => {
      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;
      mockRefreshOAuthToken.mockImplementation(async () => {
        concurrentCalls += 1;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
        await new Promise((resolve) => setTimeout(resolve, 100));
        concurrentCalls -= 1;
        return { access_token: 'a', expires_in: 3600 };
      });

      await Promise.all([
        refreshAccessToken(baseToken()),
        refreshAccessToken(baseToken()),
      ]);

      expect(maxConcurrentCalls).toBe(1);
      expect(mockRefreshOAuthToken).toHaveBeenCalledTimes(1);
    });

    it('still serializes concurrent calls after a previous refresh cycle already completed', async () => {
      // First cycle completes (and fails) before the concurrent pair below —
      // this is the exact regression case: once a map entry exists with
      // isRefreshing: false (written by either the success or failure path),
      // the acquire branch must still re-lock to true, not reuse the stale
      // false value and let both concurrent calls through unserialized.
      mockRefreshOAuthToken.mockRejectedValueOnce(new Error('network blip'));
      await refreshAccessToken(baseToken());

      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;
      mockRefreshOAuthToken.mockImplementation(async () => {
        concurrentCalls += 1;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
        await new Promise((resolve) => setTimeout(resolve, 100));
        concurrentCalls -= 1;
        return { access_token: 'fresh-access-token', expires_in: 3600 };
      });

      await Promise.all([
        refreshAccessToken(baseToken()),
        refreshAccessToken(baseToken()),
      ]);

      expect(maxConcurrentCalls).toBe(1);
    });

    it("does not clobber another call's held lock when this call fails before ever acquiring it", async () => {
      // Simulate a different call genuinely mid-refresh for this user.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any)._refreshTokenMap['user-1'] = {
        isRefreshing: true,
        token: baseToken(),
      };

      // This call throws before ever reaching the acquire branch (missing
      // providerId) — the same shape of early-throw as the wait-loop's
      // "Waiting more than 5 seconds..." timeout, which also throws before
      // the throwing call has ever acquired the lock itself. Either way, it
      // must not release a lock it never held.
      await refreshAccessToken(baseToken({ providerId: '' }));

      expect(NextClient.getRefreshToken('user-1')?.isRefreshing).toBe(true);
    });
  });

  describe('error classification', () => {
    it('returns error: "RefreshAccessTokenError" for a transient failure', async () => {
      mockRefreshOAuthToken.mockRejectedValue(new Error('network blip'));

      const result = await refreshAccessToken(baseToken());

      expect((result as { error?: string }).error).toBe(
        'RefreshAccessTokenError',
      );
    });

    it('returns error: "RefreshTokenExpired" when the underlying error is invalid_grant', async () => {
      mockRefreshOAuthToken.mockRejectedValue(
        new OAuthRefreshError('rejected', 'invalid_grant'),
      );

      const result = await refreshAccessToken(baseToken());

      expect((result as { error?: string }).error).toBe('RefreshTokenExpired');
    });
  });

  describe('success path', () => {
    it('returns a token with updated access_token and accessTokenExpires', async () => {
      mockRefreshOAuthToken.mockResolvedValue({
        access_token: 'fresh-access-token',
        refresh_token: 'fresh-refresh-token',
        expires_in: 3600,
      });

      const result = await refreshAccessToken(baseToken());

      expect((result as { access_token?: string }).access_token).toBe(
        'fresh-access-token',
      );
      expect(
        (result as { accessTokenExpires?: number }).accessTokenExpires,
      ).toBeGreaterThan(Date.now());
    });

    it('falls back to the previous refresh token when the provider omits refresh_token', async () => {
      mockRefreshOAuthToken.mockResolvedValue({
        access_token: 'fresh-access-token',
        expires_in: 3600,
      });

      const result = await refreshAccessToken(
        baseToken({ refreshToken: 'old-refresh-token' }),
      );

      expect((result as { refreshToken?: unknown }).refreshToken).toBe(
        'old-refresh-token',
      );
    });
  });
});
