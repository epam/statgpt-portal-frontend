import {
  formatDateTime,
  getRateLimitRestoreDate,
  isRateLimitStillActive,
} from '../rate-limits';
import { ERROR_CONTEXT_KIND } from '../../constants/errors';
import type { ErrorContext } from '../../models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rateLimitContext = (
  occurredAt: string,
  retryAfterSeconds?: number,
): ErrorContext => ({
  kind: ERROR_CONTEXT_KIND.RATE_LIMIT,
  occurredAt,
  retryAfterSeconds,
});

const unknownContext = (occurredAt: string): ErrorContext => ({
  kind: ERROR_CONTEXT_KIND.UNKNOWN,
  occurredAt,
});

// ---------------------------------------------------------------------------
// getRateLimitRestoreDate
// ---------------------------------------------------------------------------

describe('getRateLimitRestoreDate', () => {
  it('returns null when errorContext is undefined', () => {
    expect(getRateLimitRestoreDate(undefined)).toBeNull();
  });

  it('returns null when kind is not RATE_LIMIT', () => {
    expect(
      getRateLimitRestoreDate(unknownContext('2024-01-01T00:00:00Z')),
    ).toBeNull();
  });

  it('returns null when retryAfterSeconds is undefined', () => {
    expect(
      getRateLimitRestoreDate(
        rateLimitContext('2024-01-01T00:00:00Z', undefined),
      ),
    ).toBeNull();
  });

  it('returns null when retryAfterSeconds is not a number (non-numeric string coerced)', () => {
    const ctx = {
      kind: ERROR_CONTEXT_KIND.RATE_LIMIT,
      occurredAt: '2024-01-01T00:00:00Z',
      retryAfterSeconds: 'sixty' as unknown as number,
    } satisfies ErrorContext;
    expect(getRateLimitRestoreDate(ctx)).toBeNull();
  });

  it('returns null when occurredAt is an invalid date string', () => {
    expect(
      getRateLimitRestoreDate(rateLimitContext('not-a-date', 60)),
    ).toBeNull();
  });

  it('returns a Date offset by retryAfterSeconds from occurredAt', () => {
    const occurredAt = '2024-06-15T12:00:00Z';
    const retryAfterSeconds = 120;
    const result = getRateLimitRestoreDate(
      rateLimitContext(occurredAt, retryAfterSeconds),
    );
    const expected = new Date(
      new Date(occurredAt).getTime() + retryAfterSeconds * 1000,
    );
    expect(result).toEqual(expected);
  });

  it('returns a Date equal to occurredAt when retryAfterSeconds is 0', () => {
    const occurredAt = '2024-06-15T12:00:00Z';
    const result = getRateLimitRestoreDate(rateLimitContext(occurredAt, 0));
    expect(result).toEqual(new Date(occurredAt));
  });

  it('handles fractional retryAfterSeconds', () => {
    const occurredAt = '2024-06-15T12:00:00.000Z';
    const result = getRateLimitRestoreDate(rateLimitContext(occurredAt, 0.5));
    const expected = new Date(new Date(occurredAt).getTime() + 500);
    expect(result).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// isRateLimitStillActive
// ---------------------------------------------------------------------------

describe('isRateLimitStillActive', () => {
  it('returns false when errorContext is undefined', () => {
    expect(isRateLimitStillActive(undefined)).toBe(false);
  });

  it('returns false when kind is not RATE_LIMIT', () => {
    expect(isRateLimitStillActive(unknownContext('2024-01-01T00:00:00Z'))).toBe(
      false,
    );
  });

  it('returns false when retryAfterSeconds is undefined', () => {
    expect(
      isRateLimitStillActive(
        rateLimitContext('2024-01-01T00:00:00Z', undefined),
      ),
    ).toBe(false);
  });

  it('returns false when occurredAt is an invalid date', () => {
    expect(isRateLimitStillActive(rateLimitContext('not-a-date', 60))).toBe(
      false,
    );
  });

  it('returns true when restore date is in the future', () => {
    const farFuture = new Date(Date.now() + 10_000).toISOString();
    expect(isRateLimitStillActive(rateLimitContext(farFuture, 60))).toBe(true);
  });

  it('returns false when restore date is in the past', () => {
    const longAgo = new Date(Date.now() - 10_000).toISOString();
    expect(isRateLimitStillActive(rateLimitContext(longAgo, 1))).toBe(false);
  });

  it('returns false when restore date equals now exactly', () => {
    const now = 1_700_000_000_000;
    const occurredAt = new Date(now - 60_000).toISOString();
    // restore date = now - 60_000 + 60 * 1000 = now exactly; not strictly greater
    expect(isRateLimitStillActive(rateLimitContext(occurredAt, 60), now)).toBe(
      false,
    );
  });

  it('returns true when restore date is one millisecond in the future', () => {
    const now = 1_700_000_000_000;
    const occurredAt = new Date(now).toISOString();
    // restore date = now + 1 ms
    expect(
      isRateLimitStillActive(rateLimitContext(occurredAt, 0.001), now),
    ).toBe(true);
  });

  it('accepts an explicit now parameter', () => {
    const occurredAt = '2024-06-15T12:00:00.000Z';
    const retryAfterSeconds = 300;
    const restoreMs = new Date(occurredAt).getTime() + retryAfterSeconds * 1000;
    // just before restore
    expect(
      isRateLimitStillActive(
        rateLimitContext(occurredAt, retryAfterSeconds),
        restoreMs - 1,
      ),
    ).toBe(true);
    // just after restore
    expect(
      isRateLimitStillActive(
        rateLimitContext(occurredAt, retryAfterSeconds),
        restoreMs + 1,
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------

describe('formatDateTime', () => {
  it('returns an object with date and time string properties', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    const result = formatDateTime(date, 'en-GB');
    expect(result).toEqual(
      expect.objectContaining({
        date: expect.any(String),
        time: expect.any(String),
      }),
    );
  });

  it('formats date using the provided locale', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    const { date: dateStr } = formatDateTime(date, 'en-GB');
    expect(dateStr).toBe(date.toLocaleDateString('en-GB'));
  });

  it('formats time with 2-digit hour and minute', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    const { time } = formatDateTime(date, 'en-GB');
    expect(time).toBe(
      date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    );
  });

  it('defaults to en-GB locale when none is provided', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    const withDefault = formatDateTime(date);
    const withExplicit = formatDateTime(date, 'en-GB');
    expect(withDefault).toEqual(withExplicit);
  });

  it('works for midnight (00:00)', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const { time } = formatDateTime(date, 'en-GB');
    expect(time).toBe(
      date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    );
  });

  it('works for a different locale', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    const { date: dateStr, time } = formatDateTime(date, 'fr-FR');
    expect(dateStr).toBe(date.toLocaleDateString('fr-FR'));
    expect(time).toBe(
      date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    );
  });
});
