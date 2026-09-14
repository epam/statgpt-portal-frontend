/**
 * Shared timing constants for the token-refresh lock (auth-callbacks.ts) and
 * the underlying IdP fetch calls (oauth-refresh.ts). Kept in one place, with
 * the wait timeout derived from the fetch timeout, so the two can never
 * silently drift out of sync: a caller waiting for another caller's in-flight
 * refresh must never give up before that refresh's own fetch timeout could
 * have fired, or it will report a spurious failure while the real refresh is
 * still legitimately working.
 */

/**
 * Total time budget for a single refreshOAuthToken() call — discovery and
 * token exchange combined (a provider needing both shares one deadline, it
 * is not applied per fetch call).
 */
export const REFRESH_FETCH_TIMEOUT_MS = 15_000;

// Buffer on top of REFRESH_FETCH_TIMEOUT_MS so a waiting caller's own
// timeout can't fire at essentially the same instant as the holder's fetch
// aborts — it needs to comfortably outlast it, plus allow a moment for the
// holder to write the released lock and the next poll tick to observe it.
const WAIT_TIMEOUT_BUFFER_MS = 2_000;

/**
 * How long a caller will wait for another caller's in-flight refresh before
 * giving up and reporting its own request as failed.
 */
export const WAIT_REFRESH_TOKEN_TIMEOUT_MS =
  REFRESH_FETCH_TIMEOUT_MS + WAIT_TIMEOUT_BUFFER_MS;
