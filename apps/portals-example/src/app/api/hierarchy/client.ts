import { StructuralMetaData } from '@epam/statgpt-sdmx-toolkit';
import {
  ApiResponse,
  X_SOURCE_ARTEFACT_URN_HEADER,
} from '@epam/statgpt-shared-toolkit';
import { apiRequest } from '../api-client';

export async function getHierarchyApi(
  urn: string,
  sourceArtefactUrn?: string,
): Promise<ApiResponse<StructuralMetaData>> {
  const headers = sourceArtefactUrn
    ? { [X_SOURCE_ARTEFACT_URN_HEADER]: sourceArtefactUrn }
    : undefined;
  return apiRequest<StructuralMetaData>(
    `/api/hierarchy/${urn}`,
    'Failed to fetch hierarchy',
    { headers },
  );
}
