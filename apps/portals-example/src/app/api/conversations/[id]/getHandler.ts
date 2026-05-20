import { AuthParams } from './../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';
import { createErrorResponse } from '../../../../utils/api/create-error-response';

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
    return createErrorResponse(error, 'get-conversation');
  }
};
