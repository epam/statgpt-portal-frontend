'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Data,
  getLastUpdatedTime,
  getStructureComponentsMap,
  StructuralData,
  TimeSeries,
} from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { IconButton } from '@epam/statgpt-ui-components';

import { ICellRendererParams } from 'ag-grid-community';
import MetadataIcon from '../../../assets/icons/metadata.svg';
import Metadata from '../../AdvancedView/Metadata/Metadata';
import SidePanelMetadataContent from '../../AdvancedView/Metadata/SidePanel/SidePanelMetadataContent';
import {
  getAttributesFromParams,
  getDatasetInfoData,
  getDatasetNameItem,
  getDimensionsFromParams,
  getMetadataDescriptionItems,
  getStructureComponentsValues,
} from '../../../utils/attachments/metadata';
import { MetadataSettings } from '../../../models/metadata';
import { getDimensionGroupAttributes } from '../../../utils/attachments/group-attributes';
import { ConversationViewTitles } from '../../../models/titles';
import { Tooltip } from '../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../constants/onboarding-elements';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewSidePanelOptional } from '../../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { getDateFormattedValue } from '../../../utils/date-format';

interface MetadataCellRendererParams extends ICellRendererParams {
  attributesData: Data;
  dataSetData: StructuralData;
  locale: Locale;
  metadataSettings?: MetadataSettings;
  titles: ConversationViewTitles;
}

const MetadataCellRenderer = (params: MetadataCellRendererParams) => {
  const METADATA_SIDE_PANEL_ID = 'grid-metadata-side-panel';

  const [isOpenMetadata, setIsOpenMetadata] = useState<boolean>(false);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();
  const { isOpenedAdvancedView } = useAdvancedView();
  const sidePanel = useConversationViewSidePanelOptional();
  const { isMetadataInSidePanel } = useConversationViewFeatureToggles();
  const [isMetadataClosed, setIsMetadataClosed] = useState(false);

  const structureComponentsMap = useMemo(
    () => getStructureComponentsMap(params?.dataSetData),
    [params?.dataSetData],
  );
  const metadata = useMemo(
    () => [
      getDatasetNameItem(
        params?.dataSetData?.dataflows?.[0],
        params?.locale,
        params.titles,
      ),
      ...getStructureComponentsValues(
        getDimensionsFromParams(params, structureComponentsMap),
        structureComponentsMap,
        params?.locale,
      ),
      ...getStructureComponentsValues(
        getAttributesFromParams(params),
        structureComponentsMap,
        params?.locale,
      ),
      ...getDimensionGroupAttributes(
        params?.attributesData,
        params?.dataSetData?.dataStructures?.[0],
        structureComponentsMap,
        (params?.data?.originalData as TimeSeries)?.parsedTimeSeriesValue,
        params?.locale,
      ),
    ],
    [params, structureComponentsMap],
  );
  const metadataDescription = useMemo(
    () =>
      getMetadataDescriptionItems(
        params?.dataSetData,
        params?.locale,
        params?.valueFormatted || params?.value,
        params.titles,
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
      params.titles,
    );
  }, [params?.dataSetData, params?.locale, params.titles]);

  const openMetadata = useCallback(() => {
    if (isMetadataInSidePanel && sidePanel) {
      sidePanel.openPanel({
        id: METADATA_SIDE_PANEL_ID,
        scope: isOpenedAdvancedView ? 'advanced' : 'conversation',
        title: 'Timeseries Metadata',
        bodyClassName: 'overflow-hidden',
        content: (
          <SidePanelMetadataContent
            titles={params.titles}
            locale={params?.locale}
            metadata={metadata}
            datasetInfo={sidePanelDatasetInfo}
            metadataDescription={
              params?.metadataSettings?.isMetadataDescription
                ? metadataDescription
                : []
            }
          />
        ),
      });
      setIsMetadataClosed(true);

      return;
    }

    setIsOpenMetadata(true);
  }, [
    isMetadataInSidePanel,
    isOpenedAdvancedView,
    metadata,
    metadataDescription,
    sidePanelDatasetInfo,
    params?.locale,
    params?.metadataSettings?.isMetadataDescription,
    params.titles,
    sidePanel,
  ]);

  const closeMetadata = useCallback(() => {
    setIsOpenMetadata(false);
    setIsMetadataClosed(true);
  }, []);

  useEffect(() => {
    if (isShowOnboarding) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.METADATA_PER_SERIES,
        params.titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [params.titles, isShowOnboarding]);

  useEffect(() => {
    if (isShowOnboarding) {
      const isCurrent =
        onboardingFileSchema?.lastDisplayedElement ===
          OnboardingElements.METADATA_PER_SERIES && params.node.rowIndex === 0;

      setIsTooltipVisible(isCurrent);

      if (isCurrent) {
        setTimeout(() => {
          iconRef?.current?.scrollIntoView({
            block: 'end',
            behavior: 'smooth',
          });
        });
      }
    }
  }, [
    onboardingFileSchema?.lastDisplayedElement,
    params.node.rowIndex,
    isShowOnboarding,
  ]);

  return (
    <>
      <div ref={iconRef}>
        <IconButton
          title={params.titles?.metadata || 'View details'}
          buttonClassName="!text-neutrals-1000 !border-none !p-1"
          icon={<MetadataIcon className="w-5 h-5" />}
          onClick={openMetadata}
        />
      </div>
      {isTooltipVisible && (
        <Tooltip
          reference={iconRef}
          title={tooltipTitle}
          description={tooltipDescription}
          onReferenceClick={openMetadata}
          shouldCloseTooltip={isMetadataClosed}
        />
      )}
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

export default MetadataCellRenderer;
