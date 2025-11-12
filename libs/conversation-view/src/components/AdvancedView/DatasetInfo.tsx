'use client';

import DatasetIcon from '../../assets/icons/dataset.svg';
import MetadataIcon from '../../assets/icons/metadata.svg';
import {
  IconClock,
  IconArrowUpRight,
  IconExternalLink,
} from '@tabler/icons-react';
import {
  Dataflow,
  getLastUpdatedTime,
  getLocalizedName,
  StructuralData,
  Data,
  getStructureComponentsMap,
} from '@epam/statgpt-sdmx-toolkit';
import { IconButton } from '@epam/statgpt-ui-components';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

interface Props {
  dataset?: Dataflow | null;
  data?: Data;
  structures?: StructuralData;
  metadataSettings?: MetadataSettings;
  locale: string;
  externalLink?: string;
  isShowAgency?: boolean;
  titles?: ConversationViewTitles;
  getDatasetUpdatedTime?: (
    attributes: StructureComponentValue[],
  ) => string | null;
}

const DatasetInfo: FC<Props> = ({
  isShowAgency,
  dataset,
  data,
  structures,
  metadataSettings,
  locale,
  titles,
  getDatasetUpdatedTime,
  externalLink,
}) => {
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

  return (
    <div className={classNames('flex flex-col bg-white', 'dataset-info')}>
      {!isShowAgency ? (
        <>
          <div className="flex gap-3 mb-3">
            <p className="flex gap-1 items-center py-1 px-2 rounded-[20px] bg-accent-500 body-3">
              <DatasetIcon className="w-4 h-4" />
              {titles?.dataset ?? 'Dataset'}
            </p>
            <h5 className="flex items-center text-neutrals-700">
              <IconClock className="w-4 h-4 mr-1" />
              {titles?.lastUpdated ?? 'Last updated'}:
              <span className="ml-1">{lastUpdatedDate}</span>
            </h5>
          </div>
          <h3 className="flex items-center gap-2">
            {getLocalizedName(dataset, locale)}
            <div ref={iconRef}>
              <IconButton
                title={titles?.metadata ?? 'View details'}
                buttonClassName="!text-neutrals-1000 !border-none !w-5 !h-5 !p-0 shrink-0"
                icon={<MetadataIcon width={20} height={20} />}
                onClick={openMetadata}
              />
            </div>
            {externalLink && (
              <a href={externalLink} target="_blank" rel="noopener noreferrer">
                <IconArrowUpRight className="cursor-pointer w-6 h-6 shrink-0" />
              </a>
            )}
          </h3>
        </>
      ) : (
        <>
          <h4 className="flex items-center gap-2">
            <div ref={iconRef}>
              <IconButton
                title={titles?.metadata ?? 'View details'}
                buttonClassName="!text-neutrals-1000 !border-none !w-5 !h-5 !p-0 shrink-0"
                icon={<MetadataIcon width={20} height={20} />}
                onClick={openMetadata}
              />
            </div>
            {dataset?.name}
            {externalLink && (
              <a href={externalLink} target="_blank" rel="noopener noreferrer">
                <IconExternalLink className="text-primary cursor-pointer w-4 h-4 shrink-0" />
              </a>
            )}
          </h4>
          <div className="flex mt-1 text-neutrals-800 body-3 divide-x divide-neutrals-500">
            <p className="pr-2">
              {titles?.lastUpdated ?? 'Agency'}:
              <span className="text-neutrals-1000 pl-1">
                {dataset?.agencyID}
              </span>
            </p>
            <p className="pl-2">
              {titles?.lastUpdated ?? 'Last updated'}:
              <span className="text-neutrals-1000 pl-1">{lastUpdatedDate}</span>
            </p>
          </div>
        </>
      )}
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
