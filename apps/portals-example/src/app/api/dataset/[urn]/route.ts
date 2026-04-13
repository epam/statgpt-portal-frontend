import { apiLogger } from './../../../../core/logger';
import { NextRequest, NextResponse } from 'next/server';
import { datasetApi } from '../../api';
import { withAuth } from '../../../../utils/auth/withAuth';
import { AuthParams } from '../../../../models/auth';

export const GET = withAuth(
  async (
    req: NextRequest,
    { token }: AuthParams,
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

      const data = await datasetApi.getDataSet(
        urn,
        references,
        token?.access_token as string,
      );

      return NextResponse.json(data);
    } catch (error) {
      apiLogger.error('Dataset API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dataset' },
        { status: 500 },
      );
    }
  },
);

export const POST = withAuth(
  async (
    req: NextRequest,
    { token }: AuthParams,
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
      const data = await datasetApi.getDatasetData(
        urn,
        filters,
        token?.access_token as string,
      );

      return NextResponse.json(data);
    } catch (error) {
      apiLogger.error('Dataset data API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dataset data' },
        { status: 500 },
      );
    }
  },
);
