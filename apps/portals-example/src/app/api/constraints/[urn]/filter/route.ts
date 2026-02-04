import { apiLogger } from './../../../../../core/logger';
import { NextRequest, NextResponse } from 'next/server';
import { availabilityApi } from '../../../api';
import { withAuth } from '../../../../../utils/auth/withAuth';

export const POST = withAuth(
  async (
    req: NextRequest,
    _auth,
    context: { params: Promise<{ urn: string }> },
  ) => {
    try {
      const params = await context.params;
      const urn = params.urn;

      if (!urn) {
        return NextResponse.json({ error: 'urn is required' }, { status: 400 });
      }

      const body = await req.json();
      const { filters } = body;
      const constraints = await availabilityApi.getConstraints(urn, filters);

      return NextResponse.json(constraints);
    } catch (error) {
      apiLogger.error('Constraints API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch constraints' },
        { status: 500 },
      );
    }
  },
);
