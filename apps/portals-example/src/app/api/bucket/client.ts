import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest } from '../api-client';

const BUCKET_API_ENDPOINT = '/api/bucket';

export async function getBucketApi(): Promise<ApiResponse<{ bucket: string }>> {
  return apiRequest<{ bucket: string }>(
    BUCKET_API_ENDPOINT,
    'Failed to fetch bucket',
  );
}
