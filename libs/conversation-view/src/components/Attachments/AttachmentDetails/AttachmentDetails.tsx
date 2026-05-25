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
  dataQueries?: { disabled?: boolean }[];
}

const AttachmentDetails: FC<Props> = ({
  titles,
  attachmentInfoList,
  datasetIcon,
  dataQueries,
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
        } else if (detail.valuesTitles?.length) {
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

  const hasDisabledDatasets = dataQueries?.some((q) => q.disabled) ?? false;
  const enabledDatasetNames =
    attachmentInfoList?.map((info) => info.datasetName).filter(Boolean) ?? [];

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
      {hasDisabledDatasets && enabledDatasetNames.length > 0 && (
        <div className="body-1 mb-2 flex flex-wrap items-center gap-1">
          <span>Dataset{titles?.setToTitle ?? ' set to '}</span>
          {enabledDatasetNames.map((name) => (
            <span
              key={name}
              className="attachment-dataset-name caption !mb-0 inline-flex items-center"
            >
              <span className="attachment-dataset-icon mr-1">
                {datasetIcon}
              </span>
              {name}
            </span>
          ))}
        </div>
      )}
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
