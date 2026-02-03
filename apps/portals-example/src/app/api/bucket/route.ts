import { NextRequest, NextResponse } from 'next/server';
import { dialApiClient } from '../api';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { getToken } from 'next-auth/jwt';
import { HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_ERROR_CODES.UNAUTHORIZED },
      );
    }

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
}
