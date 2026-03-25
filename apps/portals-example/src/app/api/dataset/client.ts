import {
  StructuralMetaData,
  DataMessage,
  DatasetQueryFilters,
  SdmxReferences,
} from '@epam/statgpt-sdmx-toolkit';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest } from '../api-client';

const DATASET_API_ENDPOINT = '/api/dataset';

const buildUrl = (base: string, params: URLSearchParams) =>
  params.toString() ? `${base}?${params.toString()}` : base;

export async function getDataSetApi(
  urn: string,
  references?: SdmxReferences,
): Promise<ApiResponse<StructuralMetaData | null>> {
  const params = new URLSearchParams();
  if (references) {
    params.append('references', JSON.stringify(references));
  }

  return apiRequest(
    buildUrl(`${DATASET_API_ENDPOINT}/${urn}`, params),
    'Failed to fetch dataset',
  );
}

export async function getDataSetDataApi(
  urn: string,
  filters: DatasetQueryFilters,
): Promise<ApiResponse<DataMessage | null>> {
  return apiRequest(
    `${DATASET_API_ENDPOINT}/${urn}`,
    'Failed to fetch dataset data',
    {
      method: 'POST',
      body: { filters },
    },
  );
}
