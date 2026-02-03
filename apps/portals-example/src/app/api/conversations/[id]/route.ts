import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';
import { getToken } from 'next-auth/jwt';
import { HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_ERROR_CODES.UNAUTHORIZED },
      );
    }

    const { id } = await params;
    const conversationId = decodeURIComponent(id);

    const conversation = await conversationApi.getConversation(
      conversationId,
      token.access_token as string,
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Get conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_ERROR_CODES.UNAUTHORIZED },
      );
    }

    const { id } = await params;
    const conversationId = decodeURIComponent(id);
    const body = await request.json();

    const conversation = await conversationApi.updateConversation(
      conversationId,
      body,
      token.access_token as string,
    );

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Update conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_ERROR_CODES.UNAUTHORIZED },
      );
    }

    const { id } = await params;
    const body = await request.json();

    await conversationApi.deleteConversation(body, token.access_token as string);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 },
    );
  }
}
