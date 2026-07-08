export interface RetryWithBackoffOptions {
  retries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

/**
 * Retries an async operation on any thrown error, with exponential backoff
 * (`baseDelayMs * 2^attempt` between attempts). Retries unconditionally —
 * callers are responsible for only wrapping operations where retrying a
 * failed call has no unwanted side effects.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryWithBackoffOptions,
): Promise<T> {
  const retries = options?.retries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 300;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delayMs = baseDelayMs * 2 ** attempt;
      options?.onRetry?.(attempt, error, delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
