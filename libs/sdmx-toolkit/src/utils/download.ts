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

  window.open(`${DOWNLOAD_PATH}?${queryParams}`, '_blank');
};
