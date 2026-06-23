import {
  getDatasetInfoData,
  getDatasetNameItem,
  getDimensionsFromParams,
  getMetadataDescriptionItems,
  getObsAttributesFromParams,
  getObservationItem,
  getStructureComponentsValues,
  getTimeDimensionItem,
} from '../../../../utils/attachments/metadata';
import { ICellRendererParams } from 'ag-grid-community';
import {
  Dataflow,
  getLastUpdatedTime,
  getStructureComponentsMap,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { getDateFormattedValue } from '../../../../utils/date-format';
import { MetadataSettings } from '../../../../models/metadata';
import { ConversationViewTitles } from '@epam/statgpt-conversation-view';

export interface ObservationValueCellRendererParams extends ICellRendererParams {
  dataSetData: StructuralData;
  structuresMap?: Map<string, StructuralData | undefined>;
  locale: string;
  metadataSettings?: MetadataSettings;
  titles?: ConversationViewTitles;
}

export type ObservationMetadataContent = ReturnType<
  typeof getObservationMetadataContent
>;

export const getObservationMetadataContent = (
  params: ObservationValueCellRendererParams,
  obsAttributes: NonNullable<ReturnType<typeof getObsAttributesFromParams>>,
  getDatasetLastUpdated: (
    dataset: Dataflow | null | undefined,
  ) => string | undefined = getLastUpdatedTime,
) => {
  const dataSetData = getDataSetData(params);
  const structureComponentsMap = getStructureComponentsMap(dataSetData);
  const value = params?.valueFormatted || params?.value;
  const attributes = getStructureComponentsValues(
    obsAttributes,
    structureComponentsMap,
    params?.locale,
  );
  const metadata = [
    getDatasetNameItem(
      dataSetData?.dataflows?.[0],
      params?.locale,
      params?.titles,
    ),
    ...getStructureComponentsValues(
      getDimensionsFromParams(params, structureComponentsMap),
      structureComponentsMap,
      params?.locale,
    ),
    ...(!params?.metadataSettings?.isMetadataDescription
      ? [
          getTimeDimensionItem(dataSetData, params?.locale, params?.colDef),
          getObservationItem(value, params?.titles),
        ]
      : []),
    ...attributes,
  ];
  const metadataDescription = params?.metadataSettings?.isMetadataDescription
    ? getMetadataDescriptionItems(
        dataSetData,
        params?.locale,
        value,
        params?.titles,
        params?.colDef,
        params?.data,
      )
    : [];
  const dataset = dataSetData?.dataflows?.[0];
  const lastUpdatedDate = getDateFormattedValue(
    getDatasetLastUpdated(dataset),
    params?.locale,
  );
  const sidePanelDatasetInfo = getDatasetInfoData(
    dataset,
    lastUpdatedDate,
    params?.locale,
    params?.titles,
  );

  return {
    metadata,
    metadataDescription,
    sidePanelDatasetInfo,
  };
};

const getDataSetData = (
  params: ObservationValueCellRendererParams,
): StructuralData | undefined => {
  if (params.structuresMap) {
    const urn = params?.data?.dataset?.urn as string | undefined;
    return urn != null ? params.structuresMap.get(urn) : undefined;
  }

  return params.dataSetData;
};
