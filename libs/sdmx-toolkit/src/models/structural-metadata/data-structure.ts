import { CommonArtefactProperty } from './common-artefact-properties';
import { Annotation, Link } from './structural-metadata-base';
import { Representation } from './representation';

export interface DataStructure extends CommonArtefactProperty {
  dataStructureComponents?: DataStructureComponents;
  metadata?: string;
}

export interface MetadataStructure extends CommonArtefactProperty {
  metadataStructureComponents?: MetadataStructureComponents;
}

export interface DSDComponentBase {
  id?: string;
  name?: string;
  annotations?: Annotation[];
  links?: Link[];
  conceptRoles?: string[];
  assignmentStatus?: AssignmentStatus;
}

export interface DSDComponentConceptBase extends DSDComponentBase {
  isMandatory?: boolean;
  conceptIdentity: string;
  localRepresentation?: Representation;
}

export interface DataStructureComponents {
  attributeList?: AttributeList;
  dimensionList: DimensionList;
  measureList: MeasureList;
}

export interface AttributeList extends DSDComponentBase {
  attributes?: Attribute[];
  metadataAttributeUsages?: MetadataDsdAttribute[];
}

export interface MetadataDsdAttribute extends DSDComponentConceptBase {
  metadataAttributeReference: string;
  attributeRelationship: AttributeRelationship;
}

export interface Attribute extends DSDComponentConceptBase {
  attributeRelationship: AttributeRelationship;
}

export enum AssignmentStatus {
  CONDITIONAL = 'Conditional',
  MANDATORY = 'Mandatory',
}

export interface AttributeRelationship {
  attachmentGroups?: string[];
  dimensions?: string[];
  group?: string;
  none?: Record<string, string>;
  observation?: Record<string, string>;
}

export interface DimensionList extends DSDComponentBase {
  dimensions?: Dimension[];
  timeDimensions?: TimeDimension[];
}

export interface Dimension extends DSDComponentConceptBase {
  position?: number;
  type?: DimensionType;
}

export enum DimensionType {
  DIMENSION = 'Dimension',
  MEASURE_DIMENSION = 'MeasureDimension',
  TIME_DIMENSION = 'TimeDimension',
}

export interface MeasureList extends DSDComponentBase {
  measures?: DSDComponentConceptBase[];
}

export interface TimeDimension extends DSDComponentBase {
  conceptIdentity: string;
  localRepresentation: Representation;
  position?: number;
  type?: DimensionType;
}

export interface MetadataStructureComponents {
  metadataAttributeList?: ReportStructure;
}

export interface ReportStructure extends DSDComponentBase {
  metadataAttributes?: MetadataAttribute[];
  metadataTargets: string[];
}

export interface MetadataAttribute extends DSDComponentConceptBase {
  isPresentational?: boolean;
  localRepresentation?: Representation;
  maxOccurs?: OccurrenceType | number;
  metadataAttributes?: MetadataAttribute[];
  minOccurs?: number;
}

export enum OccurrenceType {
  UNBOUNDED = 'unbounded',
}
