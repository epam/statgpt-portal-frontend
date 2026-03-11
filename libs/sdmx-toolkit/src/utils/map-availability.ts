import {
  Component,
  ComponentValue,
  CubeRegionV3,
  DataConstraintsV3,
} from '../models/structural-metadata/constraints-v3';
import {
  CubeRegion,
  DataConstraints,
  MemberSelection,
  MemberSelectionValue,
} from '../models/structural-metadata/constraints';
import { StructuralMetaDataV3 } from '../models/structural-metadata-v3';
import { StructuralMetaData } from '../models/structural-metadata';

export function mapAvailabilityV3ToPlus(
  data: StructuralMetaDataV3,
): StructuralMetaData {
  return {
    data: {
      codelists: data.data.codelists,
      conceptSchemes: data.data.conceptSchemes,
      dataConstraints: data.data.dataConstraints?.map(mapDataConstraints),
      dataflows: data.data.dataflows,
      dataStructures: data.data.dataStructures,
      metadataStructures: data.data.metadataStructures,
    },
  };
}

function mapDataConstraints(constraint: DataConstraintsV3): DataConstraints {
  return {
    ...constraint,
    cubeRegions: constraint.cubeRegions?.map(mapCubeRegion),
  };
}

function mapCubeRegion(region: CubeRegionV3): CubeRegion {
  return {
    isIncluded: region.include,
    memberSelection: region.keyValues.map(mapComponent),
  };
}

function mapComponent(component: Component): MemberSelection {
  return {
    included: component.include,
    componentId: component.id,
    selectionValues: component.values.map(mapComponentValue),
  };
}

function mapComponentValue(value: ComponentValue): MemberSelectionValue {
  return {
    memberValue: value.value,
  };
}
