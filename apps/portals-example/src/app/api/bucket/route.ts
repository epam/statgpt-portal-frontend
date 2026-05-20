import { AuthParams } from './../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { dialApiClient } from '../api';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { withAuth } from '../../../utils/auth/withAuth';
import { createErrorResponse } from '../../../utils/api/create-error-response';

export const GET = withAuth(
  async (_req: NextRequest, { token }: AuthParams) => {
    try {
      const bucket = await dialApiClient.getRequest<{ bucket: string }>(
        DIAL_API_ROUTES.BUCKET,
        token.access_token as string,
      );

      return NextResponse.json(bucket);
    } catch (error) {
      return createErrorResponse(error, 'get-bucket');
    }
  },
);
