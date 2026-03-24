import { StructureComponentValue } from './structure-component';

export interface MetadataSettings {
  isMetadataDescription?: boolean;
}

export interface DatasetInfoData {
  dataset?: StructureComponentValue;
  agency?: StructureComponentValue;
  lastUpdated?: StructureComponentValue;
}
