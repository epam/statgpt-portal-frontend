import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequestVoid } from '../api-client';

const RATE_API_ENDPOINT = '/api/rate';

export async function rateResponseApi(
  responseId: string,
  rate: boolean,
): Promise<ApiResponse<void>> {
  return apiRequestVoid(RATE_API_ENDPOINT, 'Failed to rate response', {
    method: 'POST',
    body: { responseId, rate },
  });
}
