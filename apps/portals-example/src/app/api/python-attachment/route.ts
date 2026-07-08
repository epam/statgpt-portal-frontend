import { NextRequest, NextResponse } from 'next/server';
import { dialApiClient, DEFAULT_MODEL_ID } from '../api';
import { withAuth } from '../../../utils/auth/withAuth';
import { AuthParams } from '../../../models/auth';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { retryWithBackoff } from '@epam/statgpt-shared-toolkit';
import { createErrorResponse } from '../../../utils/api/create-error-response';
import { apiLogger } from '../../../core/logger';

const RETRY_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 300;

export const POST = withAuth(
  async (req: NextRequest, { token }: AuthParams) => {
    try {
      const body = await req.json();

      const result = await retryWithBackoff(
        () =>
          dialApiClient.postRequest<{ python_code: string }>(
            DIAL_API_ROUTES.PYTHON_ATTACHMENT(DEFAULT_MODEL_ID),
            token?.access_token as string,
            { body },
          ),
        {
          retries: RETRY_ATTEMPTS,
          baseDelayMs: RETRY_BASE_DELAY_MS,
          onRetry: (attempt, error, delayMs) =>
            apiLogger.warn(`[BFF] python-attachment retry ${attempt + 1}`, {
              delayMs,
              error: String(error),
            }),
        },
      );

      return NextResponse.json(result);
    } catch (error) {
      return createErrorResponse(error, 'get-python-attachment');
    }
  },
);
