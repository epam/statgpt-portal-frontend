export interface DeploymentDatasetsResponseData {
  deployment_id: string;
  title: string;
  n_datasets: number;
  datasets: ChannelDataset[];
}

export interface ChannelDataset {
  id: number;
  created_at: string;
  updated_at: string;

  channel_id: number;
  dataset_id: number;

  dataset: Dataset;

  preprocessing_status: ChannelDatasetStatus;
  clearing_status: ChannelDatasetStatus;

  last_completed_version: DatasetVersion | null;
  previous_completed_version: DatasetVersion | null;
  latest_version: DatasetVersion | null;
}

export type ChannelDatasetStatus = string;

export interface Dataset {
  id: number;
  created_at: string;
  updated_at: string;
  id_: string;
  title: string;
  data_source_id: number;
  details: DatasetDetails;
  description: string;
  data_source: DataSource;
  status: DatasetStatus;
  preprocessing_status: DatasetPreprocessingStatus;
}

export type DatasetPreprocessingStatus = string;
export type DatasetOnlineStatus = 'online' | 'offline' | (string & {});

export interface DatasetStatus {
  status: DatasetOnlineStatus;
  details: string;
}

export interface DatasetDetails {
  urn: Urn;
  indexer: IndexerConfig;
  citation: Citation;
  updatedAt: UpdatedAtRule[];
  dimensions: Record<string, DimensionConfig>;

  isOfficial: boolean;
  pinnedColumns: string[];
  useTitleFromSrc: boolean;

  defaultValueCodes: string[] | null;
  includeAttributes: string[];
}

export interface Urn {
  version: string;
  agencyId: string;
  resourceId: string;
}

export interface IndexerConfig {
  indicator: IndexerIndicatorConfig;
  description: string;
}

export interface IndexerIndicatorConfig {
  unpack: boolean;
  annotations: unknown | null;
  superPrimary: boolean;
  useCodeListDescription: boolean;
}

export interface Citation {
  url: string;
  provider: string;
  description: string;
  lastUpdated: string | null;
}

export interface UpdatedAtRule {
  field: string;
  source: string;
  formats: string[] | null;
}

export type DimensionTypeKey =
  | 'NON_INDICATOR'
  | 'INDICATOR'
  | 'TIME_PERIOD'
  | (string & {});

export interface DimensionConfig {
  alias: string | null;
  subtype?: string | null;
  virtual: unknown | null;
  allValues: DimensionAllValues | null;
  isRequired: boolean;
  dimensionType: DimensionTypeKey;
  defaultQueries: DimensionDefaultQuery[] | null;
}

export interface DimensionAllValues {
  id: string;
  name: string;
  description: string;
}

export interface DimensionDefaultQuery {
  values: string[];
  operator: string;
}

export interface DataSource {
  title: string;
  description: string;
  type_id: number;
  details: DataSourceDetails;
  id: number;
  created_at: string;
  updated_at: string;
  type: DataSourceType;
}

export interface DataSourceType {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
}

export interface DataSourceDetails {
  apiKey: string;
  locale: string;
  authConfig: unknown | null;

  rateLimits: {
    structureRequestsConcurrency: number | null;
    availabilityAndDataRequestsConcurrency: number | null;
  };

  sdmxConfig: SdmxConfig;

  authEnabled: boolean;
  description: string;

  sdmx1Source: string;
  apiKeyHeader: string;

  attributesUrl: string | null;
  annotationsUrl: string | null;
  dataExplorerUrl: string | null;

  datasetHierarchy: unknown | null;

  defaultValueCodes: string[];

  availabilityViaPostUrl: string | null;
  useDataExplorerForDatasetUrl: boolean;
}

export interface SdmxConfig {
  id: string;
  url: string;
  name: string;

  headers: Record<string, Record<string, string>>;
  supports: Record<string, boolean>;

  dataContentType: string;
}

export interface DatasetVersion {
  id: number;
  created_at: string;
  updated_at: string;

  channel_dataset_id: number;
  version: number;

  preprocessing_status: ChannelDatasetStatus;

  creation_reason: string;
  reason_for_failure: string | null;

  pointer_to: number;

  indexing_config_hash: string;

  structure_metadata: StructureMetadata;

  structure_hash: string;
  indicator_dimensions_hash: string;
  non_indicator_dimensions_hash: string;
  special_dimensions_hash: string | null;

  resolved_config: DatasetDetails;

  indexing_stats: unknown | null;
}

export interface StructureMetadata {
  dimensions: StructureDimension[];
}

export interface StructureDimension {
  name: string;
  entity_id: string;
}

export type ShortUrn = string;
export type DimensionKey = string;
export type UrnDimensionsIndex = Record<
  ShortUrn,
  Record<DimensionKey, DimensionConfig>
>;
