import {
  AttributeIndexValue,
  Codelist,
  Data,
  DataStructure,
  DimensionValue,
  ElementBase,
  getLocalizedName,
  StructureAttribute,
} from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { StructureComponentValue } from '../../models/structure-component';

const getDimensionsSeriesById = (
  data: Data,
  timeSeriesIds: string[],
): Map<
  string,
  {
    values: AttributeIndexValue[];
    decodedSeriesKey: string;
    codedSeriesKey: string;
  }
> => {
  const dataSet = data?.dataSets?.[0];
  const structure = data?.structures?.[0];
  const dimensionGroupAttributes = structure?.attributes?.dimensionGroup || [];
  const dimensionGroupValues = dataSet?.dimensionGroupAttributes;

  return new Map(
    dimensionGroupAttributes.map((attr) => {
      const attachedDimensions = attr?.relationship?.dimensions;
      const { codedSeriesKey, decodedSeriesKey } =
        getAttachedDimensionsSeriesKey(data, timeSeriesIds, attachedDimensions);

      return [
        attr.id,
        {
          values: dimensionGroupValues?.[codedSeriesKey] || [],
          decodedSeriesKey,
          codedSeriesKey,
        },
      ];
    }),
  );
};

const getAttachedDimensionsSeriesKey = (
  data: Data,
  timeSeriesIds: string[],
  attachedDimensions?: string[],
): { codedSeriesKey: string; decodedSeriesKey: string } => {
  const structure = data?.structures?.[0];
  const dimensions = [
    ...(structure?.dimensions.series || []),
    ...(structure?.dimensions.observation || []),
  ];
  const codedSeriesArray = new Array(dimensions?.length)?.fill('');
  const decodedSeriesArray = new Array(dimensions?.length)?.fill('');

  if (attachedDimensions) {
    attachedDimensions?.forEach((attachedDimensionId) => {
      const dimensionIndex =
        dimensions?.findIndex(
          (dimension) => dimension?.id === attachedDimensionId,
        ) || 0;

      const dimensionValue = timeSeriesIds[dimensionIndex];
      const dimensionValueIndex =
        dimensions[dimensionIndex]?.values?.findIndex(
          (dimension) =>
            dimension?.id === dimensionValue ||
            dimension?.value === dimensionValue,
        ) || 0;
      codedSeriesArray[dimensionIndex] =
        dimensionValueIndex >= 0 ? dimensionValueIndex : dimensionValue;
      decodedSeriesArray[dimensionIndex] = dimensionValue;
    });
  }

  return {
    codedSeriesKey: codedSeriesArray?.join(':'),
    decodedSeriesKey: decodedSeriesArray?.join(':'),
  };
};

const getValueFromData = (
  attribute: StructureAttribute,
  valueIndex?: AttributeIndexValue,
): DimensionValue | undefined => {
  if (valueIndex == null) {
    return void 0;
  }

  const value = attribute?.values?.[valueIndex as number];
  const isObj = typeof valueIndex === 'object' && !Array.isArray(valueIndex);
  const isArr = Array.isArray(valueIndex);

  if (!value) {
    return isObj || isArr
      ? { values: valueIndex }
      : { value: valueIndex?.toString() };
  }

  return value;
};

const getAttributeValue = (value?: DimensionValue): (string | null)[] => {
  const attrValue = value?.value || value?.id;
  const attrValues = value?.values || value?.ids;
  return attrValue != null ? [attrValue] : attrValues || [null];
};

const getAttributeValueTitle = (
  attrId?: string,
  value?: string | null,
  structureComponentsMap?: Map<string, Codelist | ElementBase>,
): string | undefined | null => {
  if (value == null) {
    return value;
  }

  const code = (
    structureComponentsMap?.get(attrId || '') as Codelist
  )?.codes?.find((code) => code?.id === value);

  return code?.name || value;
};

const getAttributeAttachedTitle = (
  key?: string,
  structureComponentsMap?: Map<string, Codelist | ElementBase>,
  dataStructure?: DataStructure,
  locale = Locale.EN,
): string[] => {
  const dimensionList = dataStructure?.dataStructureComponents?.dimensionList;

  const dimensions = [
    ...(dimensionList?.dimensions || []),
    ...(dimensionList?.timeDimensions || []),
  ];
  const titles: string[] = [];
  const splittedTimeSeries = key?.split(':') || [];

  splittedTimeSeries?.forEach((value, index) => {
    if (value !== '') {
      const dimensionId = dimensions?.[index]?.id || '';
      const name = getLocalizedName(
        structureComponentsMap?.get(dimensionId),
        locale,
      );
      const valueTitle = getAttributeValueTitle(
        dimensionId,
        value,
        structureComponentsMap,
      );
      titles.push(`${name}: ${valueTitle}`);
    }
  });
  return titles;
};

export const getDimensionGroupAttributes = (
  data?: Data,
  dataStructure?: DataStructure,
  structureComponentsMap?: Map<string, Codelist | ElementBase>,
  seriesIds?: string[],
  locale = Locale.EN,
): StructureComponentValue[] => {
  if (!data || !dataStructure || !seriesIds) {
    return [];
  }

  const dimensionGroup =
    data?.structures?.[0]?.attributes?.dimensionGroup || [];
  const dimensionGroupKeyMap = getDimensionsSeriesById(data, seriesIds);

  return (
    dimensionGroup
      ?.map((attribute, index) => {
        const dimensionData = dimensionGroupKeyMap?.get(attribute?.id);
        const attributeData = structureComponentsMap?.get(attribute?.id);
        const attributeValue = getAttributeValue(
          getValueFromData(attribute, dimensionData?.values?.[index]),
        );

        return {
          id: attribute?.id,
          title: getLocalizedName(attributeData, locale),
          value: Array.isArray(attributeValue)
            ? attributeValue?.map(
                (value) =>
                  getAttributeValueTitle(
                    attribute?.id,
                    value,
                    structureComponentsMap,
                  ) || '',
              )
            : attributeValue,
          attachedKeysTitles: getAttributeAttachedTitle(
            dimensionData?.decodedSeriesKey,
            structureComponentsMap,
            dataStructure,
          ),
          isDimensionGroup: true,
        };
      })
      ?.filter(({ value }) => value?.some((v) => !!v)) || []
  );
};
