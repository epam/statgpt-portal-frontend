import { QueryFilterType } from '../types/query-filter-type';

export interface DataQuery {
  title?: string;
  urn: string;
  sdmx1Source?: string;
  metadata: {
    countryDimension: string;
    indicatorDimensions: string[];
    datasetUrl?: string;
    timePeriodDimension?: string;
    keyDimensionIdsInDsdOrder?: string[];
  };
  filters?: QueryFilter[];
}

export interface JsonDataQuery {
  urn: string;
  sdmx1Source?: string;
  metadata: {
    // Need to support fields from data queries of older conversations
    country_dimension?: string;
    countryDimension: string;
    indicator_dimensions?: string[];
    indicatorDimensions: string[];
    datasetUrl?: string;
    timePeriodDimension?: string;
    keyDimensionIdsInDsdOrder?: string[];
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
