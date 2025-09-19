import { CommonArtefactProperty } from './common-artefact-properties';
import { Representation } from './representation';
import { ElementBase } from '../structural-metadata-base';

export interface ConceptScheme extends CommonArtefactProperty {
  concepts?: Concept[];
}

export interface Concept extends ElementBase {
  coreRepresentation?: Representation;
}
