import { GridAttachmentContent } from '@epam/statgpt-dial-toolkit';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest, apiRequestBlob, apiRequestVoid } from '../api-client';

const FILES_API_ENDPOINT = '/api/files';

export async function getFileApi(
  filePath: string,
): Promise<ApiResponse<GridAttachmentContent | null>> {
  return apiRequest(
    `${FILES_API_ENDPOINT}/${encodeURIComponent(filePath)}`,
    'Failed to fetch file',
  );
}

export async function getFileBlobApi(
  filePath: string,
): Promise<ApiResponse<Blob>> {
  return apiRequestBlob(
    `${FILES_API_ENDPOINT}/${encodeURIComponent(filePath)}/blob`,
    'Failed to fetch file blob',
  );
}

export async function deleteFileApi(
  filePath: string,
): Promise<ApiResponse<void>> {
  return apiRequestVoid(
    `${FILES_API_ENDPOINT}/${encodeURIComponent(filePath)}`,
    'Failed to delete file',
    {
      method: 'DELETE',
    },
  );
}
