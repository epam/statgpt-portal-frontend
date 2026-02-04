import { NextRequest, NextResponse } from 'next/server';
import { datasetApi } from '../../api';
import { withAuth } from '../../../../utils/auth/withAuth';

export const GET = withAuth(
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

      const { searchParams } = new URL(req.url);
      const rawReferences = searchParams.get('references');
      const references = rawReferences ? JSON.parse(rawReferences) : undefined;

      const data = await datasetApi.getDataSet(urn, references);

      return NextResponse.json(data);
    } catch (error) {
      console.error('Dataset API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dataset' },
        { status: 500 },
      );
    }
  },
);
