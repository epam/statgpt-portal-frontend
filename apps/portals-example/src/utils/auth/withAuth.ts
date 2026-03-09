import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AuthParams } from '../../models/auth';
import { HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';
import { apiLogger } from '../../core/logger';
import { getIsEnableAuthToggle } from './get-auth-toggle';
import { getIsInvalidSession } from './is-valid-session';

export function withAuth<TContext>(
  handler: (
    req: NextRequest,
    authParams: AuthParams,
    context: TContext,
  ) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context: TContext) => {
    const token = await getToken({ req });
    const isEnableAuth = getIsEnableAuthToggle();
    const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

    if (isInvalidSession) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_ERROR_CODES.UNAUTHORIZED },
      );
    }

    const authParams = { token: token ?? {} };

    try {
      return await handler(req, authParams, context);
    } catch (error) {
      apiLogger.error('Error in withAuth middleware: ${}', { error });

      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 },
      );
    }
  };
}
