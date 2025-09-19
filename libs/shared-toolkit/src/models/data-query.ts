import { QueryFilterType } from '../types/query-filter-type';

export interface DataQuery {
  title?: string;
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
  values: string[];
}

export interface QueryFilterDetails {
  id: string;
  title?: string;
  valuesTitles?: string[];
}
