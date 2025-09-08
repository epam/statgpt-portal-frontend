import { CommonArtefactProperty } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/common-artefact-properties';

export interface Dataflow extends CommonArtefactProperty {
  structure?: string;
}
