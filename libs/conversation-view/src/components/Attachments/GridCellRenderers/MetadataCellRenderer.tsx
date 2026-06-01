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
import { getExternalLinkFromContext } from './helpers/get-external-link-from-context';
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
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';
import { Tooltip } from '../../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../../constants/onboarding-elements';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewSidePanelOptional } from '../../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { getDateFormattedValue } from '../../../utils/date-format';

interface MetadataCellRendererParams extends ICellRendererParams {
  attributesData?: Data;
  attributesDataMap?: Map<string, Data | undefined>;
  dataSetData?: StructuralData;
  structuresMap?: Map<string, StructuralData | undefined>;
  locale: Locale;
  metadataSettings?: MetadataSettings;
}

const MetadataCellRenderer = (params: MetadataCellRendererParams) => {
  const { titles } = useConversationViewStyles();
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
  const rowUrn = params?.data?.dataset?.urn as string | undefined;
  const externalLink = getExternalLinkFromContext(params?.context, rowUrn);

  const resolvedDataSetData = useMemo(() => {
    if (params.structuresMap) {
      const urn = params?.data?.dataset?.urn as string | undefined;
      return urn != null ? params.structuresMap.get(urn) : undefined;
    }
    return params.dataSetData;
  }, [params.structuresMap, params.data, params.dataSetData]);

  const resolvedAttributesData = useMemo(() => {
    if (params.attributesDataMap) {
      const urn = params?.data?.dataset?.urn as string | undefined;
      return urn != null ? params.attributesDataMap.get(urn) : undefined;
    }
    return params.attributesData;
  }, [params.attributesDataMap, params.data, params.attributesData]);

  const structureComponentsMap = useMemo(
    () => getStructureComponentsMap(resolvedDataSetData),
    [resolvedDataSetData],
  );
  const metadata = useMemo(
    () => [
      getDatasetNameItem(
        resolvedDataSetData?.dataflows?.[0],
        params?.locale,
        titles,
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
        resolvedAttributesData,
        resolvedDataSetData?.dataStructures?.[0],
        structureComponentsMap,
        (params?.data?.originalData as TimeSeries)?.parsedTimeSeriesValue,
        params?.locale,
      ),
    ],
    [
      params,
      resolvedDataSetData,
      resolvedAttributesData,
      structureComponentsMap,
      titles,
    ],
  );
  const metadataDescription = useMemo(
    () =>
      getMetadataDescriptionItems(
        resolvedDataSetData,
        params?.locale,
        params?.valueFormatted || params?.value,
        titles,
        params?.colDef,
        params?.data,
      ),
    [params, resolvedDataSetData, titles],
  );
  const sidePanelDatasetInfo = useMemo(() => {
    const dataset = resolvedDataSetData?.dataflows?.[0];
    const lastUpdatedDate = getDateFormattedValue(
      getLastUpdatedTime(dataset),
      params?.locale,
    );

    return getDatasetInfoData(dataset, lastUpdatedDate, params?.locale, titles);
  }, [resolvedDataSetData, params?.locale, titles]);

  const openMetadata = useCallback(() => {
    if (isMetadataInSidePanel && sidePanel) {
      sidePanel.openPanel({
        id: METADATA_SIDE_PANEL_ID,
        scope: isOpenedAdvancedView ? 'advanced' : 'conversation',
        title: titles?.timeseriesMetadataPanel || 'Timeseries Metadata',
        bodyClassName: 'overflow-hidden',
        content: (
          <SidePanelMetadataContent
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
    externalLink,
    params?.locale,
    params?.metadataSettings?.isMetadataDescription,
    titles,
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
        titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [titles, isShowOnboarding]);

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
          title={titles?.metadata || 'View details'}
          buttonClassName="!text-neutrals-1000 !border-none !p-1"
          icon={<MetadataIcon className="size-5" />}
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
