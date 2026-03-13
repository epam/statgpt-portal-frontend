import { ERROR_CONTEXT_KIND } from '../constants/errors';

export type ErrorContextKind =
  (typeof ERROR_CONTEXT_KIND)[keyof typeof ERROR_CONTEXT_KIND];

export interface ErrorContextBase {
  // App-level error kind
  kind: ErrorContextKind;

  // When this error context was created
  occurredAt: string;
}

export interface RateLimitErrorContext extends ErrorContextBase {
  kind: typeof ERROR_CONTEXT_KIND.RATE_LIMIT;
  retryAfterSeconds?: number;
}

export interface UnknownErrorContext extends ErrorContextBase {
  kind: typeof ERROR_CONTEXT_KIND.UNKNOWN;
}

export type ErrorContext = RateLimitErrorContext | UnknownErrorContext;

export interface CustomViewState {
  errorContext?: ErrorContext;
}

export const EXCEEDED_LIMIT = {
  MINUTE: 'minute',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export type ExceededLimit =
  (typeof EXCEEDED_LIMIT)[keyof typeof EXCEEDED_LIMIT];
