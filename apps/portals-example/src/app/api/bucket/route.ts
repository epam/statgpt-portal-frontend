import { AuthParams } from './../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { dialApiClient } from '../api';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { withAuth } from '../../../utils/auth/withAuth';

export const GET = withAuth(
  async (_req: NextRequest, { token }: AuthParams) => {
    try {
      const bucket = await dialApiClient.getRequest<{ bucket: string }>(
        DIAL_API_ROUTES.BUCKET,
        token.access_token as string,
      );

      return NextResponse.json(bucket);
    } catch (error) {
      console.error('Bucket API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bucket' },
        { status: 500 },
      );
    }
  },
);
