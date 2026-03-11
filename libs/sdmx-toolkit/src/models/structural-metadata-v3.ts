import { Codelist } from './structural-metadata/codelist';
import { ConceptScheme } from './structural-metadata/concept-scheme';
import {
  DataStructure,
  MetadataStructure,
} from './structural-metadata/data-structure';
import { Dataflow } from './structural-metadata/dataflow';
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
