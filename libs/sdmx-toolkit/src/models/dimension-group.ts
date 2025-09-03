import {
  DimensionValue,
  StructureAttribute,
} from '@statgpt/sdmx-toolkit/src/models/data/structure';

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
