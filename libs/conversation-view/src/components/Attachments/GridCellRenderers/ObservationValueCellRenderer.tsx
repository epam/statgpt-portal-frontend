'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import Metadata from '../../AdvancedView/Metadata/Metadata';
import SidePanelMetadataContent from '../../AdvancedView/Metadata/SidePanel/SidePanelMetadataContent';
import {
  StructuralData,
  getLastUpdatedTime,
  getStructureComponentsMap,
} from '@epam/statgpt-sdmx-toolkit';
import {
  getDatasetNameItem,
  getDatasetInfoData,
  getDimensionsFromParams,
  getMetadataDescriptionItems,
  getObsAttributesFromParams,
  getObservationItem,
  getStructureComponentsValues,
  getTimeDimensionItem,
} from '../../../utils/attachments/metadata';
import { MetadataSettings } from '../../../models/metadata';
import { ConversationViewTitles } from '../../../models/titles';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewSidePanelOptional } from '../../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { getDateFormattedValue } from '../../../utils/date-format';

interface ObservationValueCellRendererParams extends ICellRendererParams {
  dataSetData: StructuralData;
  locale: string;
  metadataSettings?: MetadataSettings;
  titles?: ConversationViewTitles;
}

const ObservationValueCellRenderer: FC<ObservationValueCellRendererParams> = (
  params: ObservationValueCellRendererParams,
) => {
  const METADATA_SIDE_PANEL_ID = 'observation-metadata-side-panel';

  const [isOpenMetadata, setIsOpenMetadata] = useState<boolean>(false);
  const { isOpenedAdvancedView } = useAdvancedView();
  const sidePanel = useConversationViewSidePanelOptional();
  const { isMetadataInSidePanel } = useConversationViewFeatureToggles();
  const externalLink = params?.context?.externalLink as string | undefined;
  const structureComponentsMap = useMemo(
    () => getStructureComponentsMap(params?.dataSetData),
    [params?.dataSetData],
  );
  const attributes = useMemo(
    () =>
      getStructureComponentsValues(
        getObsAttributesFromParams(params),
        structureComponentsMap,
        params?.locale,
      ),
    [params, structureComponentsMap],
  );
  const metadata = useMemo(
    () => [
      getDatasetNameItem(
        params?.dataSetData?.dataflows?.[0],
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
            getTimeDimensionItem(
              params?.dataSetData,
              params?.locale,
              params?.colDef,
            ),
            getObservationItem(
              params?.valueFormatted || params?.value,
              params?.titles,
            ),
          ]
        : []),
      ...attributes,
    ],
    [params, structureComponentsMap, attributes],
  );
  const metadataDescription = useMemo(
    () =>
      getMetadataDescriptionItems(
        params?.dataSetData,
        params?.locale,
        params?.valueFormatted || params?.value,
        params?.titles,
        params?.colDef,
        params?.data,
      ),
    [params],
  );
  const sidePanelDatasetInfo = useMemo(() => {
    const dataset = params?.dataSetData?.dataflows?.[0];
    const lastUpdatedDate = getDateFormattedValue(
      getLastUpdatedTime(dataset),
      params?.locale,
    );

    return getDatasetInfoData(
      dataset,
      lastUpdatedDate,
      params?.locale,
      params?.titles,
    );
  }, [params?.dataSetData, params?.locale, params?.titles]);

  const openMetadata = useCallback(() => {
    if (isMetadataInSidePanel && sidePanel) {
      sidePanel.openPanel({
        id: METADATA_SIDE_PANEL_ID,
        scope: isOpenedAdvancedView ? 'advanced' : 'conversation',
        title: params.titles?.metadata || 'Metadata',
        bodyClassName: 'overflow-hidden',
        content: (
          <SidePanelMetadataContent
            titles={params.titles}
            locale={params?.locale}
            metadata={metadata}
            datasetInfo={sidePanelDatasetInfo}
            externalLink={externalLink}
            metadataDescription={
              params?.metadataSettings?.isMetadataDescription
                ? metadataDescription
                : []
            }
          />
        ),
      });

      return;
    }

    setIsOpenMetadata(true);
  }, [
    isMetadataInSidePanel,
    isOpenedAdvancedView,
    metadata,
    metadataDescription,
    sidePanelDatasetInfo,
    externalLink,
    params?.locale,
    params?.metadataSettings?.isMetadataDescription,
    params.titles,
    sidePanel,
  ]);

  const closeMetadata = useCallback(() => {
    setIsOpenMetadata(false);
  }, []);

  return (
    <>
      <div className="w-full h-full p-2 text-end relative">
        {params?.valueFormatted || params?.value}
        {attributes?.length > 0 && (
          <div
            className="metadata-indicator"
            title={params.titles?.metadata || 'View details'}
            onClick={openMetadata}
          ></div>
        )}
      </div>
      {isOpenMetadata && (
        <Metadata
          titles={params.titles}
          locale={params?.locale}
          metadata={metadata}
          metadataDescription={
            params?.metadataSettings?.isMetadataDescription
              ? metadataDescription
              : []
          }
          isOpenMetadata={isOpenMetadata}
          onCloseMetadata={closeMetadata}
        />
      )}
    </>
  );
};

export default ObservationValueCellRenderer;
