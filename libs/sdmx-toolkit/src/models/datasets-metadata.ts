export interface DeploymentDatasetsResponseData {
  datasets: ChannelDataset[];
}

export interface ChannelDataset {
  dataset: Dataset;
}

export interface Dataset {
  details: DatasetDetails;
}

export interface DatasetDetails {
  urn: Urn;
  dimensions: Record<string, DimensionConfig>;
}

export interface Urn {
  version: string;
  agencyId: string;
  resourceId: string;
}

export type DimensionTypeKey =
  | 'NON_INDICATOR'
  | 'INDICATOR'
  | 'TIME_PERIOD'
  | (string & {});

export type SubtypeKey = 'FREQUENCY' | 'REGION';

export interface DimensionConfig {
  alias: string | null;
  subtype?: SubtypeKey | null;
  allValues: DimensionAllValues | null;
  dimensionType: DimensionTypeKey;
}

export interface DimensionAllValues {
  id: string;
  name: string;
  description: string;
}

export type ShortUrn = string;
export type DimensionKey = string;
export type DatasetDimensionsMetadataMap = Record<
  ShortUrn,
  Record<DimensionKey, DimensionConfig>
>;
