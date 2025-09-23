import { RepresentationTextType } from '../../types/representation-text-type';

export interface Representation {
  enumeration?: string;
  format?: RepresentationTextFormat;
}

export interface RepresentationTextFormat {
  dataType?: RepresentationTextType;
}
