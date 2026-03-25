import {
  Codelist,
  Data,
  Dataflow,
  ElementBase,
  getDimensions,
  getDimensionTitle,
  getLocalizedName,
  StructuralData,
  StructureAttribute,
  TimeSeries,
} from '@epam/statgpt-sdmx-toolkit';
import { ICellRendererParams, ColDef } from 'ag-grid-community';
import { StructureComponentValue } from '../../models/structure-component';
import { GridData } from '../../types/data-grid/grid-data';
import { ConversationViewTitles } from '../../models/titles';
import { DATASET_DESCRIPTION_ITEM_IDS } from '../../constants/metadata';
import { DatasetInfoData } from '../../models/metadata';

export const getObsAttributesFromParams = (params: ICellRendererParams) =>
  params?.data[params?.colDef?.field || 0]?.obsAttributes;

export const getAttributesFromParams = (params: ICellRendererParams) =>
  params?.data?.attributes;

export const getDimensionsFromParams = (
  params: ICellRendererParams,
  structureComponentsMap: Map<string, Codelist | ElementBase>,
): { name: string; value: string }[] => {
  return Object.entries(params?.data)
    .filter(([name]) => structureComponentsMap?.get(name))
    .map(([name, value]) => ({ name, value: String(value) }));
};

const getValue = (
  value: string,
  locale: string,
  codeList?: Codelist,
): string => {
  const attributeValue = typeof value === 'object' ? value?.[locale] : value;

  return codeList
    ? getLocalizedName(
        codeList?.codes?.find((code) => code?.id === value),
        locale,
      ) || ''
    : attributeValue;
};

export const getStructureComponentsValues = (
  structureComponents: { name: string; value: string }[],
  structureComponentsMap: Map<string, Codelist | ElementBase>,
  locale: string,
): StructureComponentValue[] => {
  return (
    structureComponents?.map((component) => {
      const componentName = component?.name || '';
      const componentData = structureComponentsMap?.get(componentName);
      const codeList = (componentData as Codelist)?.codes?.length
        ? componentData
        : undefined;

      const value = Array.isArray(component?.value)
        ? component?.value.map((value) => getValue(value, locale, codeList))
        : getValue(component?.value, locale, codeList);

      return {
        id: getLocalizedName(codeList, locale) || component?.name,
        title: getLocalizedName(codeList || componentData, locale),
        value: value || component?.value,
      };
    }) || []
  );
};

export const getDatasetNameItem = (
  dataset: Dataflow | undefined | null,
  locale: string,
  titles?: ConversationViewTitles,
) => ({
  title: titles?.dataset || 'Dataset',
  value: getLocalizedName(dataset, locale),
});

export const getDatasetDescription = (
  dataset: Dataflow | undefined | null,
  lastUpdatedDate: string,
  locale: string,
  titles?: ConversationViewTitles,
) => [
  {
    ...getDatasetNameItem(dataset, locale, titles),
    id: DATASET_DESCRIPTION_ITEM_IDS.dataset,
  },
  {
    id: DATASET_DESCRIPTION_ITEM_IDS.agency,
    title: titles?.agency ?? 'Agency',
    value: dataset?.agencyID,
  },
  {
    id: DATASET_DESCRIPTION_ITEM_IDS.lastUpdated,
    title: titles?.lastUpdated ?? 'Last updated',
    value: lastUpdatedDate,
  },
];

export const getDatasetInfoData = (
  dataset: Dataflow | undefined | null,
  lastUpdatedDate: string,
  locale: string,
  titles?: ConversationViewTitles,
): DatasetInfoData => ({
  dataset: dataset
    ? {
        ...getDatasetNameItem(dataset, locale, titles),
        id: DATASET_DESCRIPTION_ITEM_IDS.dataset,
      }
    : undefined,
  agency: dataset
    ? {
        id: DATASET_DESCRIPTION_ITEM_IDS.agency,
        title: titles?.agency ?? 'Agency',
        value: dataset?.agencyID,
      }
    : undefined,
  lastUpdated: dataset
    ? {
        id: DATASET_DESCRIPTION_ITEM_IDS.lastUpdated,
        title: titles?.lastUpdated ?? 'Last updated',
        value: lastUpdatedDate,
      }
    : undefined,
});

export const getTimeDimensionItem = (
  dataSetData: StructuralData | undefined,
  locale: string,
  colDef?: ColDef,
) => ({
  title: getDimensionTitle(
    dataSetData?.conceptSchemes,
    getDimensions(dataSetData)?.timeDimensions?.[0],
    locale,
  ),
  value: colDef?.colId || '',
});

export const getObservationItem = (
  value: string,
  titles?: ConversationViewTitles,
) => ({
  title: titles?.observation || 'Observation',
  value,
});

export const getMetadataDescriptionItems = (
  dataSetData: StructuralData | undefined,
  locale: string,
  value: string,
  titles?: ConversationViewTitles,
  colDef?: ColDef,
  data?: GridData,
) => {
  const timeSeriesItem = {
    title: titles?.timeSeries || 'Time Series',
    value: (data?.originalData as TimeSeries)?.name,
  };

  return value
    ? [
        getTimeDimensionItem(dataSetData, locale, colDef),
        timeSeriesItem,
        getObservationItem(value, titles),
      ]
    : [timeSeriesItem];
};

export const getStructureAttributes = (data?: Data): StructureAttribute[] => {
  const attributes = data?.dataSets?.[0]?.attributes || [];
  const structuresAttributes = data?.structures?.[0]?.attributes?.dataSet || [];

  if (!attributes?.length) {
    return structuresAttributes;
  }

  return structuresAttributes.map((attr, index) => {
    if (attr?.values?.length > 0) {
      return { ...attr };
    }

    return { ...attr, values: [{ value: attributes?.[index] }] };
  }) as StructureAttribute[];
};

export const getDataSetAttributes = (
  structureAttributes: StructureAttribute[],
  structureComponentsMap: Map<string, Codelist | ElementBase>,
  locale: string,
): StructureComponentValue[] => {
  return (
    structureAttributes
      ?.map((structureAttribute: StructureAttribute) => {
        const id = structureAttribute?.id;
        const value =
          structureAttribute?.values?.[0]?.value ||
          structureAttribute?.values?.[0]?.id;
        const values = structureAttribute?.values?.[0]?.ids;
        const attributeData = structureComponentsMap?.get(id);
        const codeList = (attributeData as Codelist)?.codes?.length
          ? (attributeData as Codelist)
          : undefined;

        const attributeValue =
          getLocalizedName(
            codeList?.codes?.find((code) => code?.id === value),
            locale,
          ) || value;
        const attributeValues =
          values &&
          values.map(
            (value: string) =>
              getLocalizedName(
                codeList?.codes?.find((code) => code?.id === value),
                locale,
              ) || value,
          );

        return {
          id,
          title: getLocalizedName(attributeData, locale) || id,
          value: values ? attributeValues : attributeValue,
        };
      })
      .filter(({ value }) => !!value) || []
  );
};
