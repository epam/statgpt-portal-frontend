import { NextRequest, NextResponse } from 'next/server';
import { availabilityApi } from '../api';
import { getToken } from 'next-auth/jwt';
import { HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_ERROR_CODES.UNAUTHORIZED },
      );
    }

    const body = await request.json();
    const { urn, filters } = body;

    if (!urn) {
      return NextResponse.json({ error: 'urn is required' }, { status: 400 });
    }

    const constraints = await availabilityApi.getConstraints(urn, filters);

    return NextResponse.json(constraints);
  } catch (error) {
    console.error('Constraints API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch constraints' },
      { status: 500 },
    );
  }
}
