import { DataSet } from '@statgpt/sdmx-toolkit/src/models/data/dataset';
import { Structure } from '@statgpt/sdmx-toolkit/src/models/data/structure';

export interface DataMessage {
  data?: Data;
}

export interface Data {
  dataSets?: DataSet[];
  structures?: Structure[];
}

export interface DownloadData {
  data?: string;
}
