import { DataQuery } from '@epam/statgpt-shared-toolkit';

export interface DownloadDatasetItem {
  urn: string;
  name: string;
  rowCount: number;
  dataQuery?: DataQuery;
}
