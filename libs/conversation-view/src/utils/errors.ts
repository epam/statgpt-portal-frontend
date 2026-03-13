import {
  DIAL_ERROR_CODES,
  DIAL_ERROR_TYPES,
  ERROR_CONTEXT_KIND,
  ErrorContextBase,
  MessageStreamError,
  RateLimitErrorContext,
} from '@epam/statgpt-dial-toolkit';
import { HTTP_ERROR_CODES, HttpError } from '@epam/statgpt-shared-toolkit';
import { StatusMessages } from '../types/texts';

export const throwIfMessageError = ({
  error,
  statusMessages,
}: {
  error?: MessageStreamError;
  statusMessages: StatusMessages;
}) => {
  if (!error) return;

  if (error.type === DIAL_ERROR_TYPES.RATE_LIMIT_EXCEEDED) {
    const displayMessage = error.exceeded_limit?.length
      ? statusMessages.getExceededLimitsMessage(error.exceeded_limit)
      : (error.display_message ?? '');

    throw new HttpError<RateLimitErrorContext>({
      message: error.message,
      displayMessage,
      code: error.type,
      status: error.status ?? HTTP_ERROR_CODES.TOO_MANY_REQUESTS,
      details: {
        kind: ERROR_CONTEXT_KIND.RATE_LIMIT,
        occurredAt: new Date().toISOString(),
        retryAfterSeconds: Number(error.retry_after ?? ''),
      },
    });
  }

  throw new HttpError({
    message: error.message,
    status: error.status ?? HTTP_ERROR_CODES.BAD_REQUEST,
    code: error.code,
  });
};

export const resolveHttpStreamingError = ({
  error,
  statusMessages,
}: {
  error: HttpError;
  statusMessages: StatusMessages;
}): {
  errorMessage: string;
  errorContext?: ErrorContextBase;
} => {
  if (error.code === DIAL_ERROR_TYPES.RATE_LIMIT_EXCEEDED) {
    const rateLimitError = error as HttpError<RateLimitErrorContext>;

    return {
      errorMessage: rateLimitError.displayMessage ?? rateLimitError.message,
      errorContext: rateLimitError.details,
    };
  }

  if (error.code === DIAL_ERROR_CODES.CONTENT_FILTER) {
    return {
      errorMessage: statusMessages.contentFilterError ?? error.message,
    };
  }

  return {
    errorMessage:
      error.status === HTTP_ERROR_CODES.SERVICE_UNAVAILABLE
        ? statusMessages.serverOverloaded
        : statusMessages.serverError,
  };
};
