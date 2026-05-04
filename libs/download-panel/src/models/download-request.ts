import {
  DatasetQueryFilters,
  FileColumnsAttribute,
  SdmxDataFormat,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

export interface DownloadRequestItem {
  urn: string;
  name: string;
  fileName: string;
  rowCount: number;
  filters: DatasetQueryFilters;
  dataQuery?: DataQuery;
}

export interface DownloadRequestConfig {
  items: DownloadRequestItem[];
  dataFormat: SdmxDataFormat;
  dataFormatTitle: string;
  attribute: FileColumnsAttribute;
  language: string;
  isMetadata: boolean;
}
