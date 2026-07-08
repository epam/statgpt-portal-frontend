# Design: Retry for Python Attachment Endpoint

**Date:** 2026-07-08
**Author:** Mikhail Hahalushka
**Status:** Approved — ready for implementation

---

## Overview

The python attachment endpoint (called on filters Apply, both single- and multi-dataset flows) intermittently
returns a 500 from the external service it proxies to. The failure is not consistently reproducible — a retried
request commonly succeeds. Since the upstream issue cannot be fixed here, this change adds an automatic retry
with backoff around the server-side call, so a transient failure resolves silently instead of surfacing an error
to the user.

Client-side code (`invokePythonAttachment`, the browser `fetch` in `client.ts`) is unchanged. The browser still
sends exactly one request to `/api/python-attachment` and gets exactly one response — retries happen entirely
inside the Next.js route, on the server-to-DIAL leg.

---

## 1. Retry utility

New file: `libs/shared-toolkit/src/utils/retry-with-backoff.ts`

```ts
export interface RetryWithBackoffOptions {
  retries?: number; // default 2 (3 total attempts)
  baseDelayMs?: number; // default 300
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryWithBackoffOptions,
): Promise<T>
```

- Retries unconditionally on any thrown error — no status-code inspection. This is safe specifically for the
  python-attachment call because it has no side effects (it regenerates code from the current filter state; it
  is not a mutation with consequences on double-execution). The utility itself stays generic and dependency-free
  so it can be reused for other calls later; a `shouldRetry` predicate can be added if a future consumer needs
  status-aware retries.
- Backoff delay is `baseDelayMs * 2^attempt` between attempts (not after the final attempt).
- `onRetry`, if provided, is invoked once per failed-but-retryable attempt, before the delay. This keeps the
  utility logging-agnostic — callers wire it to whatever logger they have (see Section 3).
- Exported via `libs/shared-toolkit/src/utils/index.ts` → `libs/shared-toolkit/src/index.ts`, same pattern as
  `send-request.ts`.

---

## 2. Call site

`apps/portals-example/src/app/api/python-attachment/route.ts` — wrap the existing `dialApiClient.postRequest`
call:

```ts
const result = await retryWithBackoff(
  () =>
    dialApiClient.postRequest<{ python_code: string }>(
      DIAL_API_ROUTES.PYTHON_ATTACHMENT(DEFAULT_MODEL_ID),
      token?.access_token as string,
      { body },
    ),
  {
    onRetry: (attempt, error, delayMs) =>
      apiLogger.warn(`[BFF] python-attachment retry ${attempt + 1}`, {
        delayMs,
        error: String(error),
      }),
  },
);
```

The surrounding `try/catch` → `createErrorResponse(error, 'get-python-attachment')` is unchanged. If all attempts
fail, the existing error path runs exactly as it does today (already logs via `apiLogger.error`).

---

## 3. Logging

- Per-attempt failures that still have retries left are logged via `apiLogger.warn` (existing structured logger
  in `apps/portals-example/src/core/logger.ts`), matching the severity convention already used in
  `create-error-response.ts` (warn = recoverable/expected-ish, error = terminal failure).
- The final, fully-exhausted failure needs no new logging — it already goes through `createErrorResponse`, which
  logs at `error` level.
- Net effect on log volume: a request that eventually succeeds after 1-2 retries now produces 1-2 `warn` lines
  instead of what would otherwise have been an immediate `error` (today, with no retry, that failure is currently
  fatal to the request). A request that exhausts all retries produces 2 `warn` + 1 `error` instead of just 1
  `error` — slightly more volume in the worst case, but distinguishes "flaky, self-healed" from "sustained
  outage" in the logs.

---

## 4. Configuration

`retries` and `baseDelayMs` are passed as explicit named constants at the `route.ts` call site (not read from
environment variables). This is a reliability tuning knob for one specific known-flaky call, not a
per-deployment value like `DIAL_API_URL` — there is no current need to retune it without a redeploy. Revisit
only if a concrete operational need for runtime tuning shows up later.

---

## 5. Timing

With defaults (`retries: 2`, `baseDelayMs: 300`), worst case (2 failures then success, or 3 failures then
terminal error) adds up to roughly `300ms + 600ms` = 900ms of backoff on top of the call latency of each attempt,
all within the single server-side request the browser is already waiting on.

Existing stale-request protection in `invokePythonAttachment` (the `requestIdRef` counter) is unaffected — if the
user clicks Apply again while a retry is still in flight, the eventual (slow) response is discarded exactly as it
is today when a newer request has since started.

---

## 6. Testing

- `libs/shared-toolkit/src/utils/__tests__/retry-with-backoff.spec.ts`: succeeds on first try (no delay, no
  `onRetry` call); succeeds after N failures (`onRetry` called N times with correct attempt/delay values);
  exhausts retries and rethrows the last error (`onRetry` called `retries` times, not `retries + 1`).
- Route-level test for `python-attachment/route.ts`: mock `dialApiClient.postRequest` to fail once then succeed,
  assert the route still returns a success response and `apiLogger.warn` was called once.

---

## 7. Spec update required

`specs/system/filters/08-python-attachment.md` gets a short note that the server route retries the DIAL call up
to 2 times with backoff before surfacing an error, per `.claude/rules/spec-conventions.md`.

---

## Out of scope

- Client-side changes of any kind (UI, `invokePythonAttachment`, `api-client.ts`) — retries are fully invisible
  to the browser.
- Status-code-aware retry logic (e.g. skip retrying 4xx) — not needed for the one known failure mode; would add
  fragile parsing of `dialApiClient`'s plain-`Error` message string (it does not carry a typed status code today).
- Baking retry support into `dialApiClient.postRequest`/`request` itself — kept as an explicit per-call wrapper
  instead, to avoid changing behavior for other call sites that already use the shared DIAL client.
- Rolling this same change out to other apps that consume `@epam/statgpt-shared-toolkit` — tracked separately,
  gated on publishing the updated package.
