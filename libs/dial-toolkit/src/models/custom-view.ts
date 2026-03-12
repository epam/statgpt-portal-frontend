export interface ErrorContextBase {
  // App-level error kind
  kind: 'rate_limit' | 'unknown';

  // When this error context was created
  occurredAt: string;
}

export interface RateLimitErrorContext extends ErrorContextBase {
  kind: 'rate_limit';

  // Retry delay in seconds
  retryAfterSeconds?: number;
}

export interface UnknownErrorContext extends ErrorContextBase {
  kind: 'unknown';
}

export type ErrorContext = RateLimitErrorContext | UnknownErrorContext;

export interface CustomViewState {
  errorContext?: ErrorContext;
}

export type ExceededLimit = 'minute' | 'daily' | 'weekly' | 'monthly';
