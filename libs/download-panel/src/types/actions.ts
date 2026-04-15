import {
  DatasetQueryFilters,
  FileColumnsAttribute,
  SdmxDataFormat,
  StructuralMetaData,
  SeriesFilterDto,
} from '@epam/statgpt-sdmx-toolkit';
import { TimeRange } from '@epam/statgpt-shared-toolkit';

export type DownloadDatasetAction = (
  urn: string,
  format: SdmxDataFormat,
  language: string,
  attribute: FileColumnsAttribute,
  filters: DatasetQueryFilters,
  filename: string,
  isMetadata?: boolean,
) => Promise<void>;

export type GetConstraints = (
  urn: string,
  filters?: SeriesFilterDto[],
  timeRange?: TimeRange,
) => Promise<StructuralMetaData>;
