export interface Structure {
  attributes?: StructureContent<StructureAttribute>;
  dimensions: StructureContent<StructureItemBase>;
  measures: StructureContent<StructureItemBase>;
}

export interface StructureContent<T> {
  dataSet?: T[];
  observation?: T[];
  series?: T[];
  dimensionGroup?: T[];
}

export interface StructureItemBase {
  id: string;
  values: DimensionValue[];
}

export interface StructureAttribute extends StructureItemBase {
  relationship: Relationship;
}

export interface Relationship {
  dataflow: Record<string, string>;
  observation: Record<string, string>;
  dimensions?: string[];
}

export interface DimensionValue {
  id?: string;
  value?: string;
  ids?: string[];
  values?: string[];
}
