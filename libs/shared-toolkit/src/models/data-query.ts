import { QueryFilterType } from '../types/query-filter-type';

export interface DataQuery {
  title?: string;
  urn: string;
  metadata: {
    countryDimension: string;
    indicatorDimensions: string[];
    datasetUrl?: string;
  };
  filters: QueryFilter[];
}

export interface JsonDataQuery {
  urn: string;
  metadata: {
    // Need to support fields from data queries of older conversations
    country_dimension?: string;
    countryDimension: string;
    indicator_dimensions?: string[];
    indicatorDimensions: string[];
    datasetUrl?: string;
  };
  filters: JsonQueryFilter[];
}

export interface QueryFilter {
  componentCode: string;
  operator: QueryFilterType;
  values: string[];
}

export interface JsonQueryFilter extends QueryFilter {
  component_code: string;
}

export interface QueryFilterDetails {
  id: string;
  title?: string;
  valuesTitles?: string[];
}
