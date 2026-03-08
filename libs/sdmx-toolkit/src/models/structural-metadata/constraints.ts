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

// Models changes
//
// export interface CubeRegion {
//   OLD - isIncluded?: boolean;
//   include: boolean;
//   OLD - memberSelection?: MemberSelection[];
//   components: Component;
// }
//
// export interface Component {
//   // OLD - included: boolean;
//   include: boolean;
//   // OLD - componentId: string;
//   id: string
//   // OLD - selectionValues: MemberSelectionValue[];
//   values: ComponentValue[];
// }
//
// export interface ComponentValue {
//   // OLD - memberValue: string;
//   value: string;
// }
