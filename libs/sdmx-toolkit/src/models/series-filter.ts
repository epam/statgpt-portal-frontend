import { SeriesFilterOperator } from '@statgpt/sdmx-toolkit/src/types/logical-operator-type';

export interface SeriesFilterDto {
  componentCode: string;
  operator: SeriesFilterOperator;
  value: string;
}
