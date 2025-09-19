import { Codelist } from './structural-metadata/codelist';
import { ConceptScheme } from './structural-metadata/concept-scheme';
import { DataConstraints } from './structural-metadata/constraints';
import {
  DataStructure,
  MetadataStructure,
} from './structural-metadata/data-structure';
import { Dataflow } from './structural-metadata/dataflow';

export interface StructuralMetaData {
  data: StructuralData;
}

export interface StructuralData {
  codelists?: Codelist[];
  conceptSchemes?: ConceptScheme[];
  dataConstraints?: DataConstraints[];
  dataflows?: Dataflow[];
  dataStructures?: DataStructure[];
  metadataStructures?: MetadataStructure[];
}
