'use client';

import MetadataIcon from '../../assets/icons/metadata.svg';
import { IconExternalLink } from '@tabler/icons-react';
import {
  Dataflow,
  getLastUpdatedTime,
  getLocalizedName,
  StructuralData,
  Data,
  getStructureComponentsMap,
} from '@epam/statgpt-sdmx-toolkit';
import { IconButton } from '@epam/statgpt-ui-components';
import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getDateFormattedValue } from '../../utils/date-format';
import {
  getDataSetAttributes,
  getDatasetInfoData,
  getDatasetDescription,
  getDatasetNameItem,
  getStructureAttributes,
} from '../../utils/attachments/metadata';
import { MetadataSettings } from '../../models/metadata';
import Metadata from './Metadata/Metadata';
import SidePanelMetadataContent from './Metadata/SidePanel/SidePanelMetadataContent';
import { ConversationViewTitles } from '../../models/titles';
import { StructureComponentValue } from '../../models/structure-component';
import { Tooltip } from '../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../constants/onboarding-elements';
import { useOnboarding } from '../../context/OnboardingContext';
import { mergeClasses } from '../../utils/mergeClasses';
import { useConversationViewFeatureToggles } from '../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewSidePanelOptional } from '../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useAdvancedView } from '../../context/AdvancedViewContext';

export interface DatasetInfoOptions {
  isShowAgency?: boolean;
  isShowDatasetBadge?: boolean;
  datasetIcon?: ReactNode;
  externalLinkIcon?: ReactNode;
  metadataButtonClassName?: string;
  metadataIconClassName?: string;
  infoSegmentContainerClassName?: string;
  infoSegmentHeaderClassName?: string;
  nameAndMetadataContainerClassName?: string;
}

interface Props extends DatasetInfoOptions {
  dataset?: Dataflow | null;
  data?: Data;
  structures?: StructuralData;
  metadataSettings?: MetadataSettings;
  locale: string;
  externalLink?: string;
  titles?: ConversationViewTitles;
  getDatasetUpdatedTime?: (
    attributes: StructureComponentValue[],
  ) => string | null;
}

const DatasetInfo: FC<Props> = ({
  isShowAgency,
  isShowDatasetBadge,
  dataset,
  data,
  structures,
  metadataSettings,
  locale,
  titles,
  getDatasetUpdatedTime,
  externalLink,
  datasetIcon,
  externalLinkIcon,
  metadataButtonClassName,
  metadataIconClassName,
  infoSegmentContainerClassName,
  infoSegmentHeaderClassName,
  nameAndMetadataContainerClassName,
}) => {
  const METADATA_SIDE_PANEL_ID = 'dataset-metadata-side-panel';

  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>('');
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

  const datasetDescription = useMemo(
    () =>
      metadataSettings?.isMetadataDescription
        ? getDatasetDescription(dataset, lastUpdatedDate, locale, titles)
        : [],
    [
      dataset,
      lastUpdatedDate,
      locale,
      metadataSettings?.isMetadataDescription,
      titles,
    ],
  );
  const datasetMetadata = useMemo(
    () => [
      ...(!metadataSettings?.isMetadataDescription
        ? [getDatasetNameItem(dataset, locale, titles)]
        : []),
      ...getDataSetAttributes(
        getStructureAttributes(data),
        getStructureComponentsMap(structures),
        locale,
      ),
    ],
    [
      data,
      dataset,
      locale,
      metadataSettings?.isMetadataDescription,
      structures,
      titles,
    ],
  );
  const sidePanelDatasetInfo = useMemo(
    () => getDatasetInfoData(dataset, lastUpdatedDate, locale, titles),
    [dataset, lastUpdatedDate, locale, titles],
  );

  const openMetadata = useCallback(() => {
    if (isMetadataInSidePanel && sidePanel) {
      sidePanel.openPanel({
        id: METADATA_SIDE_PANEL_ID,
        scope: isOpenedAdvancedView ? 'advanced' : 'conversation',
        title: 'Dataset Metadata',
        bodyClassName: 'overflow-hidden',
        content: (
          <SidePanelMetadataContent
            titles={titles}
            locale={locale}
            metadata={datasetMetadata}
            metadataDescription={datasetDescription}
            datasetInfo={sidePanelDatasetInfo}
            externalLink={externalLink}
          />
        ),
      });
      setIsMetadataClosed(true);

      return;
    }

    setIsOpenMetadata(true);
  }, [
    datasetDescription,
    datasetMetadata,
    sidePanelDatasetInfo,
    externalLink,
    isMetadataInSidePanel,
    isOpenedAdvancedView,
    locale,
    sidePanel,
    titles,
  ]);

  const closeMetadata = useCallback(() => {
    setIsOpenMetadata(false);
    setIsMetadataClosed(true);
  }, []);

  useEffect(() => {
    const overridenValue =
      getDatasetUpdatedTime && getDatasetUpdatedTime(datasetMetadata);
    const updatedTime =
      overridenValue ||
      getDateFormattedValue(getLastUpdatedTime(dataset), locale);
    setLastUpdatedDate(updatedTime);
  }, [dataset, locale, datasetMetadata, getDatasetUpdatedTime]);

  useEffect(() => {
    if (isShowOnboarding) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.METADATA_PER_DATASET,
        titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [titles, isShowOnboarding]);

  useEffect(() => {
    if (isShowOnboarding) {
      setIsTooltipVisible(
        onboardingFileSchema?.lastDisplayedElement ===
          OnboardingElements.METADATA_PER_DATASET,
      );
    }
  }, [onboardingFileSchema?.lastDisplayedElement, isShowOnboarding]);

  const renderInfoSegment = (header: string, value: string) => (
    <div
      className={mergeClasses(
        'flex gap-1 text-neutrals-1000',
        infoSegmentContainerClassName,
      )}
    >
      <span
        className={mergeClasses('text-neutral-800', infoSegmentHeaderClassName)}
      >
        {header}:
      </span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="dataset-info flex flex-col gap-3 bg-white">
      {isShowDatasetBadge && (
        <div className="bg-accent-500 body-2 flex w-fit items-center gap-1 rounded-[20px] px-2 py-1">
          {datasetIcon}
          {titles?.dataset ?? 'Dataset'}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <div
            role="heading"
            aria-level={4}
            className={mergeClasses(
              'flex gap-1 items-center h4',
              nameAndMetadataContainerClassName,
            )}
          >
            <div ref={iconRef}>
              <IconButton
                title={titles?.metadata ?? 'View details'}
                buttonClassName={mergeClasses(
                  '!text-neutrals-1000 !border-none !w-4 !h-4 !p-0 shrink-0',
                  metadataButtonClassName,
                )}
                icon={
                  <MetadataIcon
                    className={mergeClasses('size-4', metadataIconClassName)}
                  />
                }
                onClick={openMetadata}
              />
            </div>
            <span>{getLocalizedName(dataset, locale)}</span>
          </div>
          {externalLink && (
            <a href={externalLink} target="_blank" rel="noopener noreferrer">
              {externalLinkIcon || (
                <IconExternalLink className="size-4 shrink-0 cursor-pointer text-primary" />
              )}
            </a>
          )}
        </div>
        <div className="body-3 flex items-center gap-2">
          {isShowAgency && (
            <>
              {renderInfoSegment(
                titles?.agency ?? 'Agency',
                dataset?.agencyID ?? '',
              )}
              <div
                aria-hidden="true"
                className="h-[14px] border-l border-l-neutral-500"
              />
            </>
          )}
          {renderInfoSegment(
            titles?.lastUpdated ?? 'Last updated',
            lastUpdatedDate,
          )}
        </div>
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
          titles={titles}
          locale={locale}
          metadata={datasetMetadata}
          metadataDescription={datasetDescription}
          isOpenMetadata={isOpenMetadata}
          onCloseMetadata={closeMetadata}
        />
      )}
    </div>
  );
};

export default DatasetInfo;
