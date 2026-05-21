import { AuthParams } from './../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';
import { createErrorResponse } from '../../../../utils/api/create-error-response';

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
    return createErrorResponse(error, 'update-conversation');
  }
};
