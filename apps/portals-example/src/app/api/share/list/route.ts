import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';
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

    const conversations = await conversationApi.getSharedConversations(
      token.access_token as string,
      body,
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Get shared conversations API error:', error);
    return NextResponse.json(
      { error: 'Failed to get shared conversations' },
      { status: 500 },
    );
  }
}
