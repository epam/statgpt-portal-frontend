import { Codelist } from './codelist';
import { ConceptScheme } from './concept-scheme';
import { DataConstraints } from './constraints';
import { DataStructure, MetadataStructure } from './data-structure';
import { Dataflow } from './dataflow';
import { CodelistItemBase, Hierarchy } from './hierarchy';

export interface StructuralMetaData {
  data: StructuralData;
}

export interface Glossary {
  id: string;
  agencyID?: string;
  version?: string;
  name?: string;
  terms?: CodelistItemBase[];
}

export interface StructuralData {
  codelists?: Codelist[];
  conceptSchemes?: ConceptScheme[];
  dataConstraints?: DataConstraints[];
  dataflows?: Dataflow[];
  dataStructures?: DataStructure[];
  metadataStructures?: MetadataStructure[];
  hierarchies?: Hierarchy[];
  /** SDMX-Plus API response format — used as a fallback when `codelists` is absent. */
  glossaries?: Glossary[];
}
