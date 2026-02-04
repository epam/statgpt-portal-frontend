import { apiLogger } from './../../../../core/logger';
import { AuthParams } from './../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';
import { withAuth } from '../../../../utils/auth/withAuth';

export const POST = withAuth(
  async (req: NextRequest, { token }: AuthParams) => {
    try {
      const body = await req.json();
      const { sourceUrl, destinationUrl } = body;

      if (!sourceUrl || !destinationUrl) {
        return NextResponse.json(
          { error: 'sourceUrl and destinationUrl are required' },
          { status: 400 },
        );
      }

      await conversationApi.renameConversation(
        sourceUrl,
        destinationUrl,
        token.access_token as string,
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      apiLogger.error('Rename conversation API error:', error);
      return NextResponse.json(
        { error: 'Failed to rename conversation' },
        { status: 500 },
      );
    }
  },
);
