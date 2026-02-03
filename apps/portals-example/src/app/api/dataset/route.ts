import { NextRequest, NextResponse } from 'next/server';
import { datasetApi } from '../api';
import { getToken } from 'next-auth/jwt';
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

    const { searchParams } = new URL(request.url);
    const urn = searchParams.get('urn');
    const references = searchParams.get('references');

    if (!urn) {
      return NextResponse.json({ error: 'urn is required' }, { status: 400 });
    }

    const dataset = await datasetApi.getDataSet(
      urn,
      references ? JSON.parse(references) : undefined,
    );

    return NextResponse.json(dataset);
  } catch (error) {
    console.error('Dataset API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 },
    );
  }
}

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

    const data = await datasetApi.getDatasetData(urn, filters);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dataset data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset data' },
      { status: 500 },
    );
  }
}
