import { QueryFilterType } from '@statgpt/shared-toolkit/src/types/query-filter-type';

export interface DataQuery {
  urn: string;
  metadata: {
    countryDimension: string;
    indicatorDimensions: string[];
  };
  filters: QueryFilter[];
}

export interface QueryFilter {
  componentCode: string;
  operator: QueryFilterType;
  values: string;
}
