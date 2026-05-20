import { NextRequest, NextResponse } from 'next/server';
import { dialApiClient, DEFAULT_MODEL_ID } from '../api';
import { withAuth } from '../../../utils/auth/withAuth';
import { AuthParams } from '../../../models/auth';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { createErrorResponse } from '../../../utils/api/create-error-response';

export const POST = withAuth(
  async (req: NextRequest, { token }: AuthParams) => {
    try {
      const body = await req.json();

      const result = await dialApiClient.postRequest<{ python_code: string }>(
        DIAL_API_ROUTES.PYTHON_ATTACHMENT(DEFAULT_MODEL_ID),
        token?.access_token as string,
        { body },
      );

      return NextResponse.json(result);
    } catch (error) {
      return createErrorResponse(error, 'get-python-attachment');
    }
  },
);
