import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../api';
import { getToken } from 'next-auth/jwt';
import { HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_ERROR_CODES.UNAUTHORIZED },
      );
    }

    const body = await request.json();
    const { responseId, rate } = body;

    if (!responseId || rate === undefined) {
      return NextResponse.json(
        { error: 'responseId and rate are required' },
        { status: 400 },
      );
    }

    await conversationApi.rateResponse(
      responseId,
      rate,
      token.access_token as string,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rate API error:', error);
    return NextResponse.json(
      { error: 'Failed to rate response' },
      { status: 500 },
    );
  }
}
