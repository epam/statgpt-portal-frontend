import { CommonArtefactProperty } from './common-artefact-properties';
import { ElementBase } from '../structural-metadata-base';

export interface Codelist extends CommonArtefactProperty {
  codes?: Code[];
}

export interface Code extends ElementBase {
  parent?: boolean;
}
