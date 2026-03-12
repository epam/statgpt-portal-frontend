import { ERROR_CONTEXT_KIND } from '../constants/errors';
import { ErrorContext } from '../models';

export function getRateLimitRestoreDate(
  errorContext?: ErrorContext,
): Date | null {
  if (errorContext?.kind !== ERROR_CONTEXT_KIND.RATE_LIMIT) {
    return null;
  }

  if (typeof errorContext.retryAfterSeconds !== 'number') {
    return null;
  }

  const occurredAtMs = new Date(errorContext.occurredAt).getTime();

  if (Number.isNaN(occurredAtMs)) {
    return null;
  }

  return new Date(occurredAtMs + errorContext.retryAfterSeconds * 1000);
}

export function isRateLimitStillActive(
  errorContext?: ErrorContext,
  now = Date.now(),
): boolean {
  const restoreDate = getRateLimitRestoreDate(errorContext);

  return restoreDate ? restoreDate.getTime() > now : false;
}

export function formatDateTime(
  date: Date,
  locale = 'en-GB',
): { date: string; time: string } {
  return {
    date: date.toLocaleDateString(locale),
    time: date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
