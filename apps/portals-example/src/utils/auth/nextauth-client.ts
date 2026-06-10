import { Token } from '../../models/auth';

export interface RefreshToken {
  isRefreshing: boolean;
  token: Token | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalObj = globalThis as unknown as any;

class NextClient {
  public static getRefreshToken(userId: string): RefreshToken | undefined {
    globalObj._refreshTokenMap = globalObj._refreshTokenMap || {};

    return globalObj._refreshTokenMap[userId];
  }
  public static setIsRefreshTokenStart(
    userId: string,
    refreshToken: RefreshToken,
  ): void {
    globalObj._refreshTokenMap[userId] = refreshToken;
  }

  public static delay(): Promise<undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, 50);
    });
  }
}

export default NextClient;
