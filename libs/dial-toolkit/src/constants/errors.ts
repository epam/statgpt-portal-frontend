import { ExceededLimit } from '../models';

export const DIAL_ERROR_CODES = {
  CONTENT_FILTER: 'content_filter',
  '500': '500',
};

export const DIAL_ERROR_TYPES = {
  RUNTIME_ERROR: 'runtime_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
};

export const EXCEEDED_LIMIT_ORDER: ExceededLimit[] = [
  'minute',
  'daily',
  'weekly',
  'monthly',
];

export const CUSTOM_VIEW_STATE_KEY = 'statgpt';
