import { DataQuery, ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest } from '../api-client';

const PYTHON_ATTACHMENT_ENDPOINT = '/api/python-attachment';

export async function getPythonAttachmentApi(
  queries: DataQuery[],
): Promise<ApiResponse<{ python_code: string } | null>> {
  return apiRequest(
    PYTHON_ATTACHMENT_ENDPOINT,
    'Failed to fetch python attachment',
    {
      method: 'POST',
      body: { queries },
    },
  );
}
