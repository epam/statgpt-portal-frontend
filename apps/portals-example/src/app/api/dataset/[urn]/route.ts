import { NextRequest, NextResponse } from 'next/server';
import { datasetApi } from '../../api';
import { withAuth } from '../../../../utils/auth/withAuth';
import { AuthParams } from '../../../../models/auth';
import { createErrorResponse } from '../../../../utils/api/create-error-response';

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
      return createErrorResponse(error, 'get-dataset');
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
      return createErrorResponse(error, 'get-dataset-data');
    }
  },
);
