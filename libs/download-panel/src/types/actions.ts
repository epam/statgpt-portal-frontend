import {
  DatasetQueryFilters,
  FileColumnsAttribute,
  SdmxDataFormat,
} from '@epam/statgpt-sdmx-toolkit';

export type DownloadDatasetAction = (
  urn: string,
  format: SdmxDataFormat,
  language: string,
  attribute: FileColumnsAttribute,
  filters: DatasetQueryFilters,
  filename: string,
  isMetadata?: boolean,
) => void;
