import { AuthParams } from '../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../api';
import { withAuth } from '../../../utils/auth/withAuth';
import { createErrorResponse } from '../../../utils/api/create-error-response';

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
      return createErrorResponse(error, 'rate-response');
    }
  },
);
