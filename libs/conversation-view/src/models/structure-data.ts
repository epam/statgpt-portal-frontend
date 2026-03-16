import {
  Dataflow,
  DataMessage,
  Dimension,
  StructuralData,
  StructureItemBase,
} from '@epam/statgpt-sdmx-toolkit';

export interface StructureData {
  datasetsMap?: Map<string, Dataflow | undefined>;
  dataMessagesMap?: Map<string, DataMessage | null>;
  structuresMap?: Map<string, StructuralData>;
  dimensionsMap?: Map<string, Dimension[]>;
  structureDimensionsMap?: Map<string, StructureItemBase[]>;
}

export interface DatasetData {
  dataMessage: DataMessage | null;
  structureDimensions?: StructureItemBase[];
}
