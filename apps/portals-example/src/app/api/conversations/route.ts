import { NextRequest, NextResponse } from 'next/server';
import { conversationApi, dialApiClient, DEFAULT_MODEL_ID } from '../api';
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

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || undefined;

    // First get the user's bucket
    const bucketResponse = await dialApiClient.getRequest<{ bucket: string }>(
      DIAL_API_ROUTES.BUCKET,
      token.access_token as string,
    );

    if (!bucketResponse?.bucket) {
      return NextResponse.json({ error: 'No bucket data' }, { status: 500 });
    }

    const conversations = await conversationApi.getConversations(
      token.access_token as string,
      bucketResponse.bucket,
      locale,
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 },
    );
  }
}

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

    const conversation = await conversationApi.createConversation(
      {
        ...body,
        model: { id: DEFAULT_MODEL_ID },
      },
      token.access_token as string,
    );

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Create conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 },
    );
  }
}
