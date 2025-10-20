import { FC, ReactNode } from 'react';
import { QueryFilterDetails } from '@statgpt/shared-toolkit/src/models/data-query';

interface Props {
  setToTitle?: string;
  datasetName?: string;
  datasetIcon?: ReactNode;
  isShowDatasetDetails?: boolean;
  queryFilterDetails?: QueryFilterDetails[];
}

const AttachmentDetailsItem: FC<Props> = ({
  setToTitle,
  datasetName,
  datasetIcon,
  isShowDatasetDetails,
  queryFilterDetails,
}) => {
  return (
    <div>
      {datasetName && isShowDatasetDetails && (
        <p className="caption mt-4 inline-flex items-center attachment-dataset-name">
          <span className="mr-1 attachment-dataset-icon">{datasetIcon}</span>
          {datasetName}
        </p>
      )}
      {queryFilterDetails?.map((queryFilterDetail) => (
        <p className="body-1 mb-2 last:mb-0" key={queryFilterDetail?.title}>
          {queryFilterDetail?.title}
          <span>{setToTitle ?? ' set to '}</span>
          <span className="font-bold">
            {queryFilterDetail?.valuesTitles?.join(', ')}
          </span>
        </p>
      ))}
    </div>
  );
};

export default AttachmentDetailsItem;
