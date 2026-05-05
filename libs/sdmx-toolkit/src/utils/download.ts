import { DatasetQueryFilters } from '../models';
import { FileColumnsAttribute, SdmxDataFormat } from '../types';

const DOWNLOAD_PATH = '/api/download';
const OBJECT_URL_REVOKE_DELAY_MS = 60_000;

export const openDownloadWindow = async (
  urn: string,
  format: SdmxDataFormat,
  language: string,
  attribute: FileColumnsAttribute,
  filters: DatasetQueryFilters,
  filename: string,
  isMetadata?: boolean,
  signal?: AbortSignal,
) => {
  const queryParams = new URLSearchParams({
    urn,
    format: format,
    compress: 'false',
    filename,
    filters: JSON.stringify(filters),
    attribute,
    language,
    isMetadata: isMetadata ? 'true' : 'none',
  }).toString();

  const link = `${DOWNLOAD_PATH}?${queryParams}`;

  const response = await fetch(link, {
    method: 'GET',
    credentials: 'same-origin',
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Download request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`,
    );
  }

  const blob = await response.blob();
  if (signal?.aborted) {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = objectUrl;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  window.setTimeout(
    () => URL.revokeObjectURL(objectUrl),
    OBJECT_URL_REVOKE_DELAY_MS,
  );
};
