import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../api';
import { apiLogger } from '../../../core/logger';
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

    const result = await conversationApi.generateConversationLink(
      token.access_token as string,
      body,
    );

    return NextResponse.json(result);
  } catch (error) {
    apiLogger.error('Share API error', { error });
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 },
    );
  }
}
