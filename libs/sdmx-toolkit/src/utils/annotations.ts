import { Dataflow } from '../models/structural-metadata/dataflow';
import { Annotations } from '../types/annotations';

export function getLastUpdatedTime(
  dataset: Dataflow | null | undefined,
): string | undefined {
  return dataset?.annotations?.find((annotation) => {
    if (annotation.id === Annotations.LAST_UPDATE_AT) {
      return annotation;
    }
  })?.text;
}
