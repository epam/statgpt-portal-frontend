import { DatasetQueryFilters } from '../models';
import { FileColumnsAttribute, SdmxDataFormat } from '../types';

const DOWNLOAD_PATH = '/api/download';
const OBJECT_URL_REVOKE_DELAY_MS = 60_000;
// eslint-disable-next-line no-control-regex
const UNSAFE_FILENAME_CHARS = /[\x00-\x1F\x7F<>:"/\\|?*]/g;

export const sanitizeDownloadFilename = (filename: string): string => {
  const sanitized = filename
    .normalize('NFKC')
    .replace(UNSAFE_FILENAME_CHARS, '_')
    .replace(/_+/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/^[._ ]+/, '')
    .trim();

  return sanitized || 'download';
};

const createDownloadUrl = (
  urn: string,
  format: SdmxDataFormat,
  language: string,
  attribute: FileColumnsAttribute,
  filters: DatasetQueryFilters,
  filename: string,
  isMetadata?: boolean,
): string => {
  const downloadUrl = new URL(DOWNLOAD_PATH, window.location.origin);

  downloadUrl.search = new URLSearchParams({
    urn,
    format: format,
    compress: 'false',
    filename,
    filters: JSON.stringify(filters),
    attribute,
    language,
    isMetadata: isMetadata ? 'true' : 'none',
  }).toString();

  if (
    downloadUrl.origin !== window.location.origin ||
    downloadUrl.pathname !== DOWNLOAD_PATH
  ) {
    throw new Error('Invalid download URL');
  }

  return downloadUrl.toString();
};

const triggerBrowserDownload = (blob: Blob, filename: string): void => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = sanitizeDownloadFilename(filename);
  link.rel = 'noopener noreferrer';

  link.click();

  window.setTimeout(
    () => URL.revokeObjectURL(objectUrl),
    OBJECT_URL_REVOKE_DELAY_MS,
  );
};

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
  const safeFilename = sanitizeDownloadFilename(filename);
  const link = createDownloadUrl(
    urn,
    format,
    language,
    attribute,
    filters,
    safeFilename,
    isMetadata,
  );

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

  triggerBrowserDownload(blob, safeFilename);
};
