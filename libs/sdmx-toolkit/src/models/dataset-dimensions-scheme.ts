export interface DatasetDimensionsScheme {
  timePeriod: string | undefined;
  frequency: string | undefined;
  region: string | undefined;
  indicators: string[];
  other: string[];
}
