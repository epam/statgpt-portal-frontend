import { apiLogger } from './../../../../core/logger';
import { AuthParams } from './../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';

export const putHandler = async (
  req: NextRequest,
  { token }: AuthParams,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const params = await context.params;
    const conversationId = decodeURIComponent(params.id);
    const body = await req.json();

    const conversation = await conversationApi.updateConversation(
      conversationId,
      body,
      token.access_token as string,
    );

    return NextResponse.json(conversation);
  } catch (error) {
    apiLogger.error('Update conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 },
    );
  }
};
