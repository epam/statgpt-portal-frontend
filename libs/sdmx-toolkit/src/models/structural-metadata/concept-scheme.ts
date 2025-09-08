import { CommonArtefactProperty } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/common-artefact-properties';
import { Representation } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/representation';
import { ElementBase } from '@statgpt/sdmx-toolkit/src/models/structural-metadata-base';

export interface ConceptScheme extends CommonArtefactProperty {
  concepts?: Concept[];
}

export interface Concept extends ElementBase {
  coreRepresentation?: Representation;
}
