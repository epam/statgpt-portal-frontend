import { Codelist } from './codelist';
import { ConceptScheme } from './concept-scheme';
import { DataConstraints } from './constraints';
import { DataStructure, MetadataStructure } from './data-structure';
import { Dataflow } from './dataflow';
import { Glossary, Hierarchy } from './hierarchy';

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
  hierarchies?: Hierarchy[];
  glossaries?: Glossary[];
}
