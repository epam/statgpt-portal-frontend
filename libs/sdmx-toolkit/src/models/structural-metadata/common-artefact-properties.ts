import { Annotation, ElementBase, Link } from './structural-metadata-base';

export interface CommonArtefactProperty extends ElementBase {
  agencyID?: string;
  version?: string;
  urn?: string;
  annotations?: Annotation[];
  links?: Link[];
  structure?: string;
}
