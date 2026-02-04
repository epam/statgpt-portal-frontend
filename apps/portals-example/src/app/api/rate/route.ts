import { AuthParams } from '../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../api';
import { withAuth } from '../../../utils/auth/withAuth';

export const POST = withAuth(
  async (req: NextRequest, { token }: AuthParams) => {
    try {
      const body = await req.json();
      const { responseId, rate, deploymentId } = body;

      if (!deploymentId || !responseId || rate === undefined) {
        return NextResponse.json(
          { error: 'deploymentId, responseId and rate are required' },
          { status: 400 },
        );
      }

      await conversationApi.rateResponse(
        deploymentId,
        responseId,
        rate,
        token.access_token as string,
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Rate API error:', error);
      return NextResponse.json(
        { error: 'Failed to rate response' },
        { status: 500 },
      );
    }
  },
);
