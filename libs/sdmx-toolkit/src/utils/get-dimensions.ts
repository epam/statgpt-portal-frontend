import { StructuralData } from '../models/structural-metadata/structural-metadata';
import {
  Dimension,
  DimensionList,
  DimensionType,
} from '../models/structural-metadata/data-structure';
import { DataMessage } from '../models/data/data-message';
import { StructureItemBase } from '../models/data/structure';

export function getDimensions(
  structures?: StructuralData,
): DimensionList | undefined {
  return structures?.dataStructures?.[0]?.dataStructureComponents
    ?.dimensionList;
}

export function getStructureDimensions(
  structure: DataMessage | null,
): StructureItemBase[] {
  return structure?.data?.structures?.[0]?.dimensions?.series || [];
}

export function getTimePeriods(structure: DataMessage | null): string[] {
  return (
    structure?.data?.structures?.[0]?.dimensions?.observation?.[0].values
      .map((value) => (value.value ? value.value : value.id))
      .filter((value) => value != null) || []
  );
}

export function getTimeDimension(dimensions: Dimension[]): Dimension {
  return dimensions.find(
    (dimension) => dimension.type === DimensionType.TIME_DIMENSION,
  ) as Dimension;
}
