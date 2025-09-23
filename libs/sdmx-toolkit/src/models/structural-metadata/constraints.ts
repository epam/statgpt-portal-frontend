import { CommonArtefactProperty } from './common-artefact-properties';

export interface DataConstraints extends CommonArtefactProperty {
  cubeRegions?: CubeRegion[];
}

export interface CubeRegion {
  isIncluded?: boolean;
  memberSelection?: MemberSelection[];
}

export interface MemberSelection {
  included: boolean;
  componentId: string;
  selectionValues: MemberSelectionValue[];
}

export interface MemberSelectionValue {
  memberValue: string;
}
