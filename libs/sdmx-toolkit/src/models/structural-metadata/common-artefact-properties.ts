import {
  Annotation,
  ElementBase,
  Link,
} from '@statgpt/sdmx-toolkit/src/models/structural-metadata-base';

export interface CommonArtefactProperty extends ElementBase {
  agencyID?: string;
  version?: string;
  urn?: string;
  annotations?: Annotation[];
  links?: Link[];
  structure?: string;
}
