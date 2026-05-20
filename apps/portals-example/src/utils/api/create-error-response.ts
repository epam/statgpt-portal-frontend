import { NextResponse } from 'next/server';
import { isHttpError } from '@epam/statgpt-shared-toolkit';
import { apiLogger } from '../../core/logger';

export function createErrorResponse(
  error: unknown,
  operation: string,
): NextResponse {
  const status = isHttpError(error) ? error.status : 500;
  const message = isHttpError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Internal Server Error';
  const code = isHttpError(error) ? error.code : undefined;

  if (status === 401) {
    apiLogger.warn(
      `[BFF] Forwarding upstream 401 for ${operation} — user token may be invalid at upstream`,
    );
  }

  apiLogger.error(`[BFF] ${operation} failed`, {
    status,
    message,
    code,
    error: String(error),
  });

  return NextResponse.json(
    { error: { message, status, code, operation } },
    { status },
  );
}
