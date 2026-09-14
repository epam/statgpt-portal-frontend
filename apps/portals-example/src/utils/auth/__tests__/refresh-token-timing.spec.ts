import {
  REFRESH_FETCH_TIMEOUT_MS,
  WAIT_REFRESH_TOKEN_TIMEOUT_MS,
} from '../refresh-token-timing';

describe('refresh-token-timing', () => {
  it('derives the wait timeout from the fetch timeout, not as an independent constant', () => {
    // The whole point of this module is that these two values can never
    // silently drift apart again — a hardcoded WAIT_REFRESH_TOKEN_TIMEOUT_MS
    // (e.g. `= 17000`) would pass a "same value today" check but re-open the
    // exact regression this file exists to prevent the next time
    // REFRESH_FETCH_TIMEOUT_MS changes without a matching manual edit here.
    expect(WAIT_REFRESH_TOKEN_TIMEOUT_MS).toBeGreaterThan(
      REFRESH_FETCH_TIMEOUT_MS,
    );
  });

  it('gives waiters at least a 1 second margin over the fetch timeout', () => {
    expect(
      WAIT_REFRESH_TOKEN_TIMEOUT_MS - REFRESH_FETCH_TIMEOUT_MS,
    ).toBeGreaterThanOrEqual(1_000);
  });
});
