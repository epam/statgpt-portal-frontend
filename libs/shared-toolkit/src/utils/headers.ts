import {
  APPLICATION_JSON,
  API_KEY_HEADER,
  X_CONVERSATION_ID_HEADER,
  CONTENT_TYPE_HEADER,
  OCP_APIM_SUBSCRIPTION_KEY_HEADER,
} from '../constants/headers';
import { ApiHeaders } from '../models/api';

export const getHeaders = (
  apiKey?: string,
  options?: {
    jwt?: string;
    chatReference?: string;
    contentType?: string | null;
  },
  optionsHeaders?: Record<string, string>,
): Record<string, string> => {
  const headers: ApiHeaders = {};

  if (options?.contentType !== null) {
    headers[CONTENT_TYPE_HEADER] = options?.contentType || APPLICATION_JSON;
  }

  if (options?.jwt) {
    headers.Authorization = `Bearer ${options.jwt}`;
  } else if (apiKey) {
    headers[API_KEY_HEADER] = apiKey;
  }

  if (options?.chatReference) {
    headers[X_CONVERSATION_ID_HEADER] = options.chatReference;
  }

  return { ...headers, ...optionsHeaders };
};

export const sanitizeHeaders = (
  headers: ApiHeaders,
): Record<string, string> => {
  const sanitized = { ...headers };
  if (sanitized[API_KEY_HEADER]) {
    sanitized[API_KEY_HEADER] =
      sanitized[API_KEY_HEADER].substring(0, 8) + '...[REDACTED]';
  }

  if (sanitized.Authorization) {
    sanitized.Authorization = 'Bearer [REDACTED]';
  }

  if (sanitized[OCP_APIM_SUBSCRIPTION_KEY_HEADER]) {
    sanitized[OCP_APIM_SUBSCRIPTION_KEY_HEADER] =
      sanitized[OCP_APIM_SUBSCRIPTION_KEY_HEADER].substring(0, 8) +
      '...[REDACTED]';
  }

  return sanitized;
};

export const getMultipartHeaders = (
  boundary: string,
): Record<string, string> => ({
  'Content-Type': `multipart/form-data; boundary=${boundary}`,
});
