import { AuthParams } from './../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi, dialApiClient } from '../api';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';

export const getHandler = async (req: NextRequest, { token }: AuthParams) => {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || undefined;

    // First get the user's bucket
    // TODO: pass bucket as param because client app code has already fetched it
    const bucketResponse = await dialApiClient.getRequest<{ bucket: string }>(
      DIAL_API_ROUTES.BUCKET,
      token.access_token as string,
    );

    if (!bucketResponse?.bucket) {
      return NextResponse.json({ error: 'No bucket data' }, { status: 500 });
    }

    const conversations = await conversationApi.getConversations(
      token.access_token as string,
      bucketResponse.bucket,
      locale,
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 },
    );
  }
};
