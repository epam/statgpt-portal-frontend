import { CommonArtefactProperty } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/common-artefact-properties';
import { ElementBase } from '@statgpt/sdmx-toolkit/src/models/structural-metadata-base';

export interface Codelist extends CommonArtefactProperty {
  codes?: Code[];
}

export interface Code extends ElementBase {
  parent?: boolean;
}
