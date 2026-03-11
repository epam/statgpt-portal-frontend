import { Annotation } from '../models/structural-metadata/structural-metadata-base';
import { Annotations } from '../types/annotations';

export const getTimeSeriesCount = (
  annotations: Annotation[] | undefined,
): string => {
  return (
    annotations?.find(
      (annotation) => annotation.id === Annotations.SERIES_COUNT,
    )?.title || ''
  );
};
