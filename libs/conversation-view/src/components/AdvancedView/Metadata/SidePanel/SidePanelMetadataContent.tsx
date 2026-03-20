'use client';

import { FC, useCallback, useMemo } from 'react';
import { StructureComponentValue } from '../../../../models/structure-component';
import { ConversationViewTitles } from '../../../../models/titles';
import { DATASET_DESCRIPTION_ITEM_IDS } from '../../../../constants/metadata';
import DatasetInfoDetails from './DatasetInfoDetails';
import { DatasetInfoData } from '../../../../models/metadata';

interface Props {
  metadata?: StructureComponentValue[];
  metadataDescription?: StructureComponentValue[];
  datasetInfo?: DatasetInfoData;
  titles?: ConversationViewTitles;
  locale: string;
}

const SPECIAL_DATASET_DESCRIPTION_IDS = new Set<string>(
  Object.values(DATASET_DESCRIPTION_ITEM_IDS),
);

const SidePanelMetadataContent: FC<Props> = ({
  metadata,
  metadataDescription = [],
  datasetInfo,
  titles,
  locale,
}) => {
  const formatValue = useCallback(
    (value: StructureComponentValue['value']) => {
      if (Array.isArray(value)) {
        return value
          .map((valueItem) =>
            typeof valueItem === 'object'
              ? (valueItem?.[locale] ?? '')
              : valueItem,
          )
          .join(', ');
      }

      if (typeof value === 'object' && value !== null) {
        return value?.[locale] ?? '';
      }

      return value ?? '';
    },
    [locale],
  );

  const { dataset, agency, lastUpdated, hasStructuredDatasetInfo } =
    useMemo(() => {
      const fallbackDataset = metadataDescription.find(
        (item) => item?.id === DATASET_DESCRIPTION_ITEM_IDS.dataset,
      );
      const fallbackAgency = metadataDescription.find(
        (item) => item?.id === DATASET_DESCRIPTION_ITEM_IDS.agency,
      );
      const fallbackLastUpdated = metadataDescription.find(
        (item) => item?.id === DATASET_DESCRIPTION_ITEM_IDS.lastUpdated,
      );
      const dataset = datasetInfo?.dataset || fallbackDataset;
      const agency = datasetInfo?.agency || fallbackAgency;
      const lastUpdated = datasetInfo?.lastUpdated || fallbackLastUpdated;

      return {
        dataset,
        agency,
        lastUpdated,
        hasStructuredDatasetInfo: Boolean(dataset),
      };
    }, [datasetInfo, metadataDescription]);

  const genericDescriptionItems = useMemo(
    () =>
      hasStructuredDatasetInfo
        ? metadataDescription.filter(
            (item) =>
              !item?.id || !SPECIAL_DATASET_DESCRIPTION_IDS.has(item.id),
          )
        : metadataDescription,
    [hasStructuredDatasetInfo, metadataDescription],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden px-5 pb-4">
      {hasStructuredDatasetInfo && dataset && (
        <DatasetInfoDetails
          dataset={dataset}
          agency={agency}
          lastUpdated={lastUpdated}
          formatValue={formatValue}
        />
      )}

      {genericDescriptionItems.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {genericDescriptionItems.map((descriptionItem, index) => (
            <div
              key={`${descriptionItem?.id || descriptionItem?.title}-${index}`}
              className="flex gap-2 body-3"
            >
              <span className="shrink-0 text-neutrals-800">
                {descriptionItem?.title}:
              </span>
              <span className="min-w-0 truncate font-semibold text-neutrals-1000">
                {formatValue(descriptionItem?.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {metadata?.length ? (
          <div className="flex flex-col gap-4">
            {metadata.map((metadataItem) => (
              <div
                key={metadataItem?.id || metadataItem?.title}
                className="flex flex-col gap-1"
              >
                {metadataItem?.attachedKeysTitles?.map((attachedKeyTitle) => (
                  <div
                    key={attachedKeyTitle}
                    title={attachedKeyTitle}
                    className="body-3 text-neutrals-800"
                  >
                    {attachedKeyTitle}
                  </div>
                ))}
                <p
                  title={metadataItem?.title}
                  className="body-3 text-neutrals-800"
                >
                  {metadataItem?.title}
                </p>
                <p
                  title={formatValue(metadataItem?.value)}
                  className="body-2 break-words text-neutrals-1000"
                >
                  {formatValue(metadataItem?.value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-neutrals-700 body-3">
            {titles?.noMetadata || 'No metadata'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanelMetadataContent;
