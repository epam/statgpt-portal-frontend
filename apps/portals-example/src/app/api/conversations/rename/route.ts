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
    const { sourceUrl, destinationUrl } = body;

    if (!sourceUrl || !destinationUrl) {
      return NextResponse.json(
        { error: 'sourceUrl and destinationUrl are required' },
        { status: 400 },
      );
    }

    await conversationApi.renameConversation(
      sourceUrl,
      destinationUrl,
      token.access_token as string,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rename conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to rename conversation' },
      { status: 500 },
    );
  }
}
