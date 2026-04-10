import { FC, ReactNode, useMemo } from 'react';
import classNames from 'classnames';
import AttachmentDetailsItem from './AttachmentDetailsItem';
import { AttachmentInfo } from '../../../models/attachments';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { SHARED_FILTER_IDS } from '../../../utils/multiple-filters';
import { QueryFilterDetails } from '@epam/statgpt-shared-toolkit';

interface Props {
  titles: {
    queryUpdatedManuallyTitle?: string;
    setToTitle?: string;
  };
  attachmentInfoList?: AttachmentInfo[];
  datasetIcon?: ReactNode;
}

const AttachmentDetails: FC<Props> = ({
  titles,
  attachmentInfoList,
  datasetIcon,
}) => {
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();

  const { sharedFilterDetails, perDatasetInfoList } = useMemo(() => {
    if (!isCrossDatasetModeOn) {
      return {
        sharedFilterDetails: [] as QueryFilterDetails[],
        perDatasetInfoList: [] as AttachmentInfo[],
      };
    }

    const sharedFiltersMap = new Map<string, QueryFilterDetails>();
    const perDatasetInfoList: AttachmentInfo[] = [];

    attachmentInfoList?.forEach((info) => {
      const datasetOnlyFilters: QueryFilterDetails[] = [];

      info.queryFiltersDetails?.forEach((detail) => {
        if (SHARED_FILTER_IDS.has(detail.id)) {
          const existing = sharedFiltersMap.get(detail.id);
          if (existing) {
            sharedFiltersMap.set(detail.id, {
              ...existing,
              valuesTitles: Array.from(
                new Set([
                  ...(existing.valuesTitles || []),
                  ...(detail.valuesTitles || []),
                ]),
              ),
            });
          } else {
            sharedFiltersMap.set(detail.id, { ...detail });
          }
        } else {
          datasetOnlyFilters.push(detail);
        }
      });

      if (datasetOnlyFilters.length) {
        perDatasetInfoList.push({
          ...info,
          queryFiltersDetails: datasetOnlyFilters,
        });
      }
    });

    return {
      sharedFilterDetails: Array.from(sharedFiltersMap.values()),
      perDatasetInfoList,
    };
  }, [isCrossDatasetModeOn, attachmentInfoList]);

  return (
    <div className="attachment-details flex flex-col">
      <p
        className={classNames(
          'body-1',
          ((attachmentInfoList && attachmentInfoList.length <= 1) ||
            (isCrossDatasetModeOn && sharedFilterDetails.length > 0)) &&
            'mb-2',
        )}
      >
        {titles?.queryUpdatedManuallyTitle ??
          'Query has been updated manually.'}
      </p>
      {isCrossDatasetModeOn ? (
        <>
          {sharedFilterDetails.length > 0 && (
            <AttachmentDetailsItem
              setToTitle={titles?.setToTitle}
              queryFilterDetails={sharedFilterDetails}
            />
          )}
          {perDatasetInfoList.map((info) => (
            <AttachmentDetailsItem
              key={info.datasetName}
              setToTitle={titles?.setToTitle}
              datasetName={info.datasetName}
              datasetIcon={datasetIcon}
              isShowDatasetDetails
              queryFilterDetails={info.queryFiltersDetails}
            />
          ))}
        </>
      ) : (
        attachmentInfoList?.map(
          (attachmentInfo) =>
            !!attachmentInfo?.queryFiltersDetails?.length && (
              <AttachmentDetailsItem
                key={attachmentInfo?.datasetName}
                setToTitle={titles?.setToTitle}
                datasetName={attachmentInfo?.datasetName}
                datasetIcon={datasetIcon}
                isShowDatasetDetails={attachmentInfoList?.length > 1}
                queryFilterDetails={attachmentInfo?.queryFiltersDetails}
              />
            ),
        )
      )}
    </div>
  );
};

export default AttachmentDetails;
