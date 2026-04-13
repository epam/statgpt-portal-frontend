import { StructuralMetaData } from '@epam/statgpt-sdmx-toolkit';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest } from '../api-client';

export async function getAvailableHierarchiesApi(
  urn: string,
): Promise<ApiResponse<StructuralMetaData>> {
  return apiRequest<StructuralMetaData>(
    `/api/codelist/${urn}`,
    'Failed to fetch hierarchies',
  );
}
