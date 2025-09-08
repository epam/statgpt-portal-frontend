import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';
import { Annotations } from '@statgpt/sdmx-toolkit/src/types/annotations';

export function getLastUpdatedTime(
  dataset: Dataflow | null | undefined,
): string | undefined {
  return dataset?.annotations?.find((annotation) => {
    if (annotation.id === Annotations.LAST_UPDATE_AT) {
      return annotation;
    }
  })?.value;
}
