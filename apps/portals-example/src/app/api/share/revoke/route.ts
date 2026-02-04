import { AuthParams } from './../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';
import { withAuth } from '../../../../utils/auth/withAuth';

export const POST = withAuth(
  async (req: NextRequest, { token }: AuthParams) => {
    try {
      const body = await req.json();

      await conversationApi.revokeSharedConversations(
        token.access_token as string,
        body,
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Revoke shared conversations API error:', error);
      return NextResponse.json(
        { error: 'Failed to revoke shared conversations' },
        { status: 500 },
      );
    }
  },
);
