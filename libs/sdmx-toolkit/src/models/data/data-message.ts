import { DataSet } from './dataset';
import { Structure } from './structure';

export interface DataMessage {
  data?: Data;
}

export interface Data {
  dataSets?: DataSet[];
  structures?: Structure[];
}
