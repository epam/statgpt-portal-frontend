import { DimensionGroupAttribute } from '@statgpt/sdmx-toolkit/src/models/dimension-group';

export interface TimeSeries {
  name: string; // TODO: review/refactor - use only parsedTimeSeriesValue
  parsedTimeSeriesValue: string[];
  values: TimeSeriesValue[];
  attributes: TimeSeriesObservation[];
  dataSetAttrs?: TimeSeriesObservation[];
  dimensionGroupAttributes?: DimensionGroupAttribute[];
}

export interface TimeSeriesValue {
  values: TimeSeriesObservation[];
  dimensionAtObservation: string;
  obsAttributes: TimeSeriesObservation[];
}

export interface TimeSeriesObservation {
  name: string;
  value: string;
}
