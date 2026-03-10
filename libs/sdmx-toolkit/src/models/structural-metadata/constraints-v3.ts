import { CommonArtefactProperty } from './common-artefact-properties';

export interface DataConstraintsV3 extends CommonArtefactProperty {
  cubeRegions?: CubeRegionV3[];
}

export interface CubeRegionV3 {
  keyValues: Component[];
  include: boolean;
}

export interface Component {
  include: boolean;
  id: string;
  values: ComponentValue[];
}

export interface ComponentValue {
  value: string;
}
