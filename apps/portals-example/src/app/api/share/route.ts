import { AuthParams } from './../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../api';
import { withAuth } from '../../../utils/auth/withAuth';
import { createErrorResponse } from '../../../utils/api/create-error-response';

export const POST = withAuth(
  async (req: NextRequest, { token }: AuthParams) => {
    try {
      const body = await req.json();

      const result = await conversationApi.generateConversationLink(
        token.access_token as string,
        body,
      );

      return NextResponse.json(result);
    } catch (error) {
      return createErrorResponse(error, 'share-conversation');
    }
  },
);
