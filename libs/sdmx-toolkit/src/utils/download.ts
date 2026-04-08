import { DatasetQueryFilters } from '../models';
import { FileColumnsAttribute, SdmxDataFormat } from '../types';

const DOWNLOAD_PATH = '/api/download';

export const openDownloadWindow = (
  urn: string,
  format: SdmxDataFormat,
  language: string,
  attribute: FileColumnsAttribute,
  filters: DatasetQueryFilters,
  filename: string,
  isMetadata?: boolean,
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
  const a = document.createElement('a');
  a.href = link;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
