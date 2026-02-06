import { apiLogger } from './../../../core/logger';
import { AuthParams } from './../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi, DEFAULT_MODEL_ID } from '../api';

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
    apiLogger.error('Create conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 },
    );
  }
};
