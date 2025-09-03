import { Codelist } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/codelist';
import { ConceptScheme } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/concept-scheme';
import { DataConstraints } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/constraints';
import {
  DataStructure,
  MetadataStructure,
} from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';

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
