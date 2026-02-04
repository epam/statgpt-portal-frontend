import { AuthParams } from './../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';
import { withAuth } from '../../../../utils/auth/withAuth';

export const POST = withAuth(
  async (req: NextRequest, { token }: AuthParams) => {
    try {
      const body = await req.json();

      const conversations = await conversationApi.getSharedConversations(
        token.access_token as string,
        body,
      );

      return NextResponse.json(conversations);
    } catch (error) {
      console.error('Get shared conversations API error:', error);
      return NextResponse.json(
        { error: 'Failed to get shared conversations' },
        { status: 500 },
      );
    }
  },
);
