import { NextRequest, NextResponse } from 'next/server';
import { hierarchyApi } from '../../api';
import { withAuth } from '../../../../utils/auth/withAuth';

export const GET = withAuth(
  async (
    _req: NextRequest,
    _auth,
    context: { params: Promise<{ urn: string }> },
  ) => {
    const { urn } = await context.params;

    if (!urn) {
      return NextResponse.json({ error: 'urn is required' }, { status: 400 });
    }

    const data = await hierarchyApi.getAvailableHierarchies(urn);
    return NextResponse.json(data);
  },
);
