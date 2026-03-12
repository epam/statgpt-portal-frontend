import { EXCEEDED_LIMIT, ExceededLimit } from '../models';

export const DIAL_ERROR_CODES = {
  CONTENT_FILTER: 'content_filter',
  '500': '500',
};

export const DIAL_ERROR_TYPES = {
  RUNTIME_ERROR: 'runtime_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
};

export const EXCEEDED_LIMIT_ORDER: ExceededLimit[] = [
  EXCEEDED_LIMIT.MINUTE,
  EXCEEDED_LIMIT.DAILY,
  EXCEEDED_LIMIT.WEEKLY,
  EXCEEDED_LIMIT.MONTHLY,
];

export const CUSTOM_VIEW_STATE_KEY = 'statgpt';

export const ERROR_CONTEXT_KIND = {
  RATE_LIMIT: 'rate_limit',
  UNKNOWN: 'unknown',
} as const;
