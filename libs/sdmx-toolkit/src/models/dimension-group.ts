import { DimensionValue, StructureAttribute } from './data/structure';

export interface DimensionGroup {
  values: number[];
  decodedSeriesKey: string;
  codedSeriesKey: string;
}

export interface DimensionGroupAttribute {
  dimensionGroupData: DimensionGroup;
  attribute: StructureAttribute;
  dimensionGroupValue: DimensionValue;
}
