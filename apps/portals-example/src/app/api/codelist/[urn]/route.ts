import { apiLogger } from '../../../../core/logger';
import { NextRequest, NextResponse } from 'next/server';
import { hierarchyApi } from '../../api';
import { withAuth } from '../../../../utils/auth/withAuth';
import { AuthParams } from '../../../../models/auth';
import { X_SOURCE_ARTEFACT_URN_HEADER } from '@epam/statgpt-shared-toolkit';

export const GET = withAuth(
  async (
    req: NextRequest,
    { token }: AuthParams,
    context: { params: Promise<{ urn: string }> },
  ) => {
    try {
      const { urn } = await context.params;

      if (!urn) {
        return NextResponse.json({ error: 'urn is required' }, { status: 400 });
      }

      const sourceArtefactUrn =
        req.headers.get(X_SOURCE_ARTEFACT_URN_HEADER) ?? undefined;
      const data = await hierarchyApi.getAvailableHierarchies(
        urn,
        token?.access_token as string,
        sourceArtefactUrn,
      );
      return NextResponse.json(data);
    } catch (error) {
      apiLogger.error('Codelist API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hierarchies' },
        { status: 500 },
      );
    }
  },
);
