import { Series, SeriesObservations } from '../../types/series';

export interface DataSet {
  annotations?: number[];
  attributes?: (number | null)[];
  observations?: SeriesObservations;
  series?: Series;
  structure?: number;
  dimensionGroupAttributes?: SeriesObservations;
}

export interface SeriesDeclaration {
  attributes: (number | string)[];
  observations: SeriesObservations;
}
