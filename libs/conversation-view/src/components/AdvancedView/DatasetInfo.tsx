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
import classNames from 'classnames';
import {
  getDataSetAttributes,
  getDatasetDescription,
  getDatasetNameItem,
  getStructureAttributes,
} from '../../utils/attachments/metadata';
import { MetadataSettings } from '../../models/metadata';
import Metadata from './Metadata/Metadata';
import { ConversationViewTitles } from '../../models/titles';
import { StructureComponentValue } from '../../models/structure-component';
import { Tooltip } from '../Tooltip/Tooltip';
import { getTooltipDataByElement } from '../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../constants/onboarding-elements';
import { useOnboarding } from '../../context/OnboardingContext';
import { mergeClasses } from '../../utils/mergeClasses';

export interface DatasetInfoOptions {
  isShowAgency?: boolean;
  isShowDatasetBadge?: boolean;
  metadataIcon?: ReactNode;
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
  metadataIcon,
  datasetIcon,
  externalLinkIcon,
  metadataButtonClassName,
  metadataIconClassName,
  infoSegmentContainerClassName,
  infoSegmentHeaderClassName,
  nameAndMetadataContainerClassName,
}) => {
  console.log('🚀 ~ DatasetInfo ~ datasetIcon:', !!datasetIcon);
  console.log('🚀 ~ DatasetInfo ~ isShowAgency:', isShowAgency);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>('');
  const [isOpenMetadata, setIsOpenMetadata] = useState<boolean>(false);

  const iconRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();
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

  const openMetadata = useCallback(() => {
    setIsOpenMetadata(true);
  }, []);

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
      className={classNames(
        'flex gap-1 text-neutrals-1000',
        infoSegmentContainerClassName,
      )}
    >
      <span
        className={classNames('text-neutral-800', infoSegmentHeaderClassName)}
      >
        {header}:
      </span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className={classNames('flex flex-col bg-white gap-3', 'dataset-info')}>
      {isShowDatasetBadge && (
        <div className="flex gap-1 items-center py-1 px-2 rounded-[20px] bg-accent-500 body-2 w-fit">
          {datasetIcon}
          {titles?.dataset ?? 'Dataset'}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex gap-1 items-center">
          <div
            className={mergeClasses(
              'flex gap-1 items-center h4',
              nameAndMetadataContainerClassName,
            )}
          >
            <div ref={iconRef}>
              <IconButton
                title={titles?.metadata ?? 'View details'}
                buttonClassName={classNames(
                  '!text-neutrals-1000 !border-none !w-4 !h-4 !p-0 shrink-0',
                  metadataButtonClassName,
                )}
                icon={
                  metadataIcon || (
                    <MetadataIcon
                      className={classNames('size-4', metadataIconClassName)}
                    />
                  )
                }
                onClick={openMetadata}
              />
            </div>
            <span>{getLocalizedName(dataset, locale)}</span>
          </div>
          {externalLink && (
            <a href={externalLink} target="_blank" rel="noopener noreferrer">
              {externalLinkIcon || (
                <IconExternalLink className="text-primary cursor-pointer w-4 h-4 shrink-0" />
              )}
            </a>
          )}
        </div>
        <div className="flex gap-2 body-3 items-center">
          {isShowAgency && (
            <>
              {renderInfoSegment(
                titles?.lastUpdated ?? 'Agency',
                dataset?.agencyID ?? '',
              )}
              <div className="border-l border-l-neutral-500 h-[14px]" />
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
