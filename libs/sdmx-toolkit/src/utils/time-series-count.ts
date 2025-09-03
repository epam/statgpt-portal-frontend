import { Annotation } from '@statgpt/sdmx-toolkit/src/models/structural-metadata-base';
import { Annotations } from '@statgpt/sdmx-toolkit/src/types/annotations';

export const getTimeSeriesCount = (
  annotations: Annotation[] | undefined,
): string => {
  return (
    annotations?.find(
      (annotation) => annotation.id === Annotations.SERIES_COUNT,
    )?.title || ''
  );
};
