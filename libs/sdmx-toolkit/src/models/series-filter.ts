import { SeriesFilterOperator } from '../types/logical-operator-type';

export interface SeriesFilterDto {
  componentCode: string;
  operator: SeriesFilterOperator;
  value: string;
}
