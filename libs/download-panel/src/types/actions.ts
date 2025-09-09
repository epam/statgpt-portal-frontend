import { DownloadData } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';
import {
  FileColumnsAttribute,
  SdmxDataFormat,
} from '@statgpt/sdmx-toolkit/src/types/files';

export type DownloadDatasetAction = (
  urn: string,
  format: SdmxDataFormat,
  language: string,
  attribute: FileColumnsAttribute,
  filters: DatasetQueryFilters,
  isMetadata?: boolean,
) => Promise<DownloadData>;
