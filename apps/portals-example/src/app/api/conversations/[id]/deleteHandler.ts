import { AuthParams } from './../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';

export const deleteHandler = async (
  req: NextRequest,
  { token }: AuthParams,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const params = await context.params;
    const conversationId = decodeURIComponent(params.id);
    const body = await req.json();

    await conversationApi.deleteConversation(
      conversationId,
      body,
      token.access_token as string,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 },
    );
  }
};
