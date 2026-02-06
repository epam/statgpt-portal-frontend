import { apiLogger } from './../../../../core/logger';
import { AuthParams } from './../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';

export const getHandler = async (
  _req: NextRequest,
  { token }: AuthParams,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const params = await context.params;
    const conversationId = decodeURIComponent(params.id);

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
    apiLogger.error('Get conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 },
    );
  }
};
