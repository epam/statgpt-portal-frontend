import { DataMessage } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { DimensionGroup } from '@statgpt/sdmx-toolkit/src/models/dimension-group';
import { SeriesObservations } from '@statgpt/sdmx-toolkit/src/types/series';

export const getAttachedDimensionsSeriesByTsId = (
  dataMessage: DataMessage | undefined,
  timeSeriesIds: string[],
): Record<string, DimensionGroup> => {
  const dataSet = dataMessage?.data?.dataSets?.[0];
  const structure = dataMessage?.data?.structures?.[0];
  const dimensionGroupAttributes = structure?.attributes?.dimensionGroup || [];
  const dimensionGroupValues = dataSet?.dimensionGroupAttributes;

  const data: Record<string, DimensionGroup> = {};

  for (const attr of dimensionGroupAttributes) {
    const attachedDimensions = attr.relationship.dimensions;
    const { codedSeriesKey, decodedSeriesKey } = getAttachedDimensionsSeriesKey(
      dataMessage,
      timeSeriesIds,
      attachedDimensions,
    );

    data[attr.id] = {
      values:
        (dimensionGroupValues?.[
          codedSeriesKey as keyof SeriesObservations
        ] as number[]) || [],
      decodedSeriesKey,
      codedSeriesKey,
    };
  }

  return data;
};

export const getAttachedDimensionsSeriesKey = (
  dataMessage: DataMessage | undefined,
  timeSeriesIds: string[],
  attachedDimensions?: string[],
): { codedSeriesKey: string; decodedSeriesKey: string } => {
  const structure = dataMessage?.data?.structures?.[0];
  const dimensions = [
    ...(structure?.dimensions.series || []),
    ...(structure?.dimensions.observation || []),
  ];
  const emptyCodedArray = new Array(dimensions?.length);
  const emptyDecodedArray = new Array(dimensions?.length);

  attachedDimensions?.forEach((dimensionId) => {
    const dimensionIndex =
      dimensions?.findIndex((d) => d.id === dimensionId) || 0;

    const dimensionValue = timeSeriesIds[dimensionIndex];
    const dimensionValueIndex =
      dimensions[dimensionIndex].values.findIndex(
        (d) => d.id === dimensionValue || d.value === dimensionValue,
      ) || 0;
    emptyCodedArray[dimensionIndex] =
      dimensionValueIndex >= 0 ? dimensionValueIndex : dimensionValue;
    emptyDecodedArray[dimensionIndex] = dimensionValue;
  });

  return {
    codedSeriesKey: emptyCodedArray.join(':'),
    decodedSeriesKey: emptyDecodedArray.join(':'),
  };
};

export const getAttachedDimensionsSeriesByDimension = (
  dataMessage?: DataMessage,
  dimensionId?: string,
  dimensionValue?: string,
): Record<string, DimensionGroup> => {
  const dataSet = dataMessage?.data?.dataSets?.[0];
  const structure = dataMessage?.data?.structures?.[0];
  const dimensionGroupAttributes = (
    structure?.attributes?.dimensionGroup || []
  ).filter(
    (d) =>
      d.relationship.dimensions?.length === 1 &&
      d.relationship.dimensions.includes(dimensionId || ''),
  );
  const dimensionGroupValues = dataSet?.dimensionGroupAttributes;

  const dimensions = [
    ...(structure?.dimensions.series || []),
    ...(structure?.dimensions.observation || []),
  ];
  const dimensionIndex = dimensions?.findIndex((d) => d.id === dimensionId);
  const emptyArray = new Array(dimensions?.length) as string[];
  emptyArray[dimensionIndex] = dimensionValue || '';

  const data: Record<string, DimensionGroup> = {};

  for (const attr of dimensionGroupAttributes) {
    const attachedDimensions = attr.relationship.dimensions;
    const { codedSeriesKey, decodedSeriesKey } = getAttachedDimensionsSeriesKey(
      dataMessage,
      emptyArray,
      attachedDimensions,
    );

    data[attr.id] = {
      values:
        (dimensionGroupValues?.[
          codedSeriesKey as keyof SeriesObservations
        ] as number[]) || [],
      decodedSeriesKey,
      codedSeriesKey,
    };
  }

  return data;
};
