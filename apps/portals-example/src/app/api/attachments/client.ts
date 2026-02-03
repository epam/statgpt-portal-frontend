import { GridAttachmentContent } from '@epam/statgpt-dial-toolkit';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest, apiRequestBlob } from '../api-client';

const ATTACHMENTS_API_ENDPOINT = '/api/attachments';

export async function getFileApi(
  filePath: string,
): Promise<ApiResponse<GridAttachmentContent | null>> {
  return apiRequest(
    `${ATTACHMENTS_API_ENDPOINT}?filePath=${encodeURIComponent(filePath)}`,
    'Failed to fetch file',
  );
}

export async function getFileBlobApi(
  filePath: string,
): Promise<ApiResponse<Blob>> {
  return apiRequestBlob(
    `${ATTACHMENTS_API_ENDPOINT}/blob?filePath=${encodeURIComponent(filePath)}`,
    'Failed to fetch file blob',
  );
}
