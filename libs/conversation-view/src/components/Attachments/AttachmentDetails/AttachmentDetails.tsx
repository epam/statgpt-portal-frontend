import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import AttachmentDetailsItem from './AttachmentDetailsItem';
import { AttachmentInfo } from '../../../models/attachments';

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
  return (
    <div className="attachment-details flex flex-col">
      <p
        className={classNames(
          'body-1',
          attachmentInfoList && attachmentInfoList.length <= 1 && 'mb-2',
        )}
      >
        {titles?.queryUpdatedManuallyTitle ??
          'Query has been updated manually.'}
      </p>
      {attachmentInfoList?.map(
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
      )}
    </div>
  );
};

export default AttachmentDetails;
