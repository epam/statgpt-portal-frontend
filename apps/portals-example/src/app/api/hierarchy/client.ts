import { StructuralMetaData } from '@epam/statgpt-sdmx-toolkit';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest } from '../api-client';

export async function getHierarchyApi(
  urn: string,
): Promise<ApiResponse<StructuralMetaData>> {
  return apiRequest<StructuralMetaData>(
    `/api/hierarchy/${urn}`,
    'Failed to fetch hierarchy',
  );
}
