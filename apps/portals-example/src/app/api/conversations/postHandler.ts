import { AuthParams } from './../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi, DEFAULT_MODEL_ID } from '../api';
import { createErrorResponse } from '../../../utils/api/create-error-response';

export const postHandler = async (req: NextRequest, { token }: AuthParams) => {
  try {
    const body = await req.json();

    const conversation = await conversationApi.createConversation(
      {
        ...body,
        model: { id: DEFAULT_MODEL_ID },
      },
      token.access_token as string,
    );

    return NextResponse.json(conversation);
  } catch (error) {
    return createErrorResponse(error, 'create-conversation');
  }
};
