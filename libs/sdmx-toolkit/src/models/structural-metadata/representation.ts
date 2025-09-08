import { RepresentationTextType } from '@statgpt/sdmx-toolkit/src/types/representation-text-type';

export interface Representation {
  enumeration?: string;
  format?: RepresentationTextFormat;
}

export interface RepresentationTextFormat {
  dataType?: RepresentationTextType;
}
