import { Codelist } from './codelist';
import { ConceptScheme } from './concept-scheme';
import { DataStructure, MetadataStructure } from './data-structure';
import { Dataflow } from './dataflow';
import { DataConstraintsV3 } from './constraints-v3';

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
