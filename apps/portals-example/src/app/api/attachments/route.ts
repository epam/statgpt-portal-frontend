import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../api';
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

    const file = await conversationApi.getFile(
      filePath,
      token.access_token as string,
    );

    return NextResponse.json(file);
  } catch (error) {
    console.error('Attachments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 },
    );
  }
}
