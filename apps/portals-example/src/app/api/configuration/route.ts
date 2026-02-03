import { NextRequest, NextResponse } from 'next/server';
import { dialApiClient, DEFAULT_MODEL_ID } from '../api';
import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { getToken } from 'next-auth/jwt';
import { MessageFormSchema } from '@epam/ai-dial-shared';
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

    const result = await dialApiClient.getRequest<MessageFormSchema>(
      DIAL_API_ROUTES.CONFIGURATION(DEFAULT_MODEL_ID),
      token.access_token as string,
    );

    return NextResponse.json({
      suggestionsList: result?.properties.starter.oneOf || [],
      welcomeText: result?.properties.starter?.description || '',
    });
  } catch (error) {
    console.error('Configuration API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 },
    );
  }
}
