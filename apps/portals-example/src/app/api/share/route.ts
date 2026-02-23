import { AuthParams } from './../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../api';
import { apiLogger } from '../../../core/logger';
import { withAuth } from '../../../utils/auth/withAuth';

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
      apiLogger.error('Share API error', { error });
      return NextResponse.json(
        { error: 'Failed to generate share link' },
        { status: 500 },
      );
    }
  },
);
