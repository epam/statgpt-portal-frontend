import {
  Codelist,
  ConceptScheme,
  Dataflow,
  DataStructure,
  MetadataStructure,
} from '@epam/statgpt-sdmx-toolkit';
import { DataConstraintsV3 } from './structural-metadata/constraints-v3';

export interface StructuralMetaDataV3 {
  data: StructuralDataV3;
}

export interface StructuralDataV3 {
  codelists?: Codelist[];
  conceptSchemes?: ConceptScheme[];
  dataConstraints?: DataConstraintsV3[];
  dataflows?: Dataflow[];
  dataStructures?: DataStructure[];
  metadataStructures?: MetadataStructure[];
}
