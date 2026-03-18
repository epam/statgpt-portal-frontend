import {
  DataConstraints,
  Dataflow,
  DataMessage,
  Dimension,
  StructuralData,
  StructureItemBase,
} from '@epam/statgpt-sdmx-toolkit';

export interface StructureDataMaps {
  datasetsMap?: Map<string, Dataflow | undefined>;
  dataMessagesMap?: Map<string, DataMessage | null>;
  structuresMap?: Map<string, StructuralData | undefined>;
  dimensionsMap?: Map<string, Dimension[]>;
  structureDimensionsMap?: Map<string, StructureItemBase[]>;
  constraintsMap?: Map<string, DataConstraints[] | undefined>;
}

export interface DatasetData {
  dataMessage: DataMessage | null;
  structureDimensions?: StructureItemBase[];
}
