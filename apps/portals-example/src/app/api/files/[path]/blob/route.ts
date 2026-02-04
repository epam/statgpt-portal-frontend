import { AuthParams } from './../../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../../api';
import { withAuth } from '../../../../../utils/auth/withAuth';

export const GET = withAuth(
  async (
    _req: NextRequest,
    { token }: AuthParams,
    context: { params: Promise<{ path: string }> },
  ) => {
    try {
      const params = await context.params;
      const path = params.path;

      if (!path) {
        return NextResponse.json(
          { error: 'file path is required' },
          { status: 400 },
        );
      }

      const blob = await conversationApi.getFileBlob(
        path,
        token.access_token as string,
      );

      if (!blob) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      return new NextResponse(blob, {
        headers: {
          'Content-Type': blob.type || 'application/octet-stream',
        },
      });
    } catch (error) {
      console.error('Files blob API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch file blob' },
        { status: 500 },
      );
    }
  },
);
