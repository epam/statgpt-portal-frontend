import { NextRequest, NextResponse } from 'next/server';
import { datasetApi } from '../../../api';
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
      const data = await datasetApi.getDatasetData(urn, filters);

      return NextResponse.json(data);
    } catch (error) {
      console.error('Dataset data API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dataset data' },
        { status: 500 },
      );
    }
  },
);
