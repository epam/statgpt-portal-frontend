import { NextResponse } from 'next/server';
import { isHttpError } from '@epam/statgpt-shared-toolkit';
import { apiLogger } from '../../core/logger';

export function createErrorResponse(
  error: unknown,
  operation: string,
): NextResponse {
  const httpErr = isHttpError(error) ? error : null;
  const status = httpErr?.status ?? 500;
  const message =
    httpErr?.message ??
    (error instanceof Error ? error.message : 'Internal Server Error');
  const code = httpErr?.code;

  if (status === 401) {
    apiLogger.warn(`[BFF] Forwarding upstream 401 for ${operation}`, {
      status: 401,
      operation,
    });
    return NextResponse.json(
      { error: { message, status, code, operation } },
      { status },
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
