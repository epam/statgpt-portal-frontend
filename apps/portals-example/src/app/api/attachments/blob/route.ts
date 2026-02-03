import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';
import { getToken } from 'next-auth/jwt';
import { HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_ERROR_CODES.UNAUTHORIZED },
      );
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');

    if (!filePath) {
      return NextResponse.json(
        { error: 'filePath is required' },
        { status: 400 },
      );
    }

    const blob = await conversationApi.getFileBlob(
      filePath,
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
    console.error('Attachments blob API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file blob' },
      { status: 500 },
    );
  }
}
