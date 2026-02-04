import {
  StructuralMetaData,
  SeriesFilterDto,
} from '@epam/statgpt-sdmx-toolkit';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest } from '../api-client';

const CONSTRAINTS_API_ENDPOINT = '/api/constraints';

export async function getConstraintsApi(
  urn: string,
  filters?: SeriesFilterDto[],
): Promise<ApiResponse<StructuralMetaData>> {
  return apiRequest(
    `${CONSTRAINTS_API_ENDPOINT}/${urn}/filter`,
    'Failed to fetch constraints',
    {
      method: 'POST',
      body: { filters },
    },
  );
}
