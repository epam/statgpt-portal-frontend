import { FC, ReactNode } from 'react';
import { QueryFilterDetails } from '@epam/statgpt-shared-toolkit';

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
      {queryFilterDetails?.map((queryFilterDetail) => (
        <div
          className="body-1 mb-2 flex flex-wrap items-center gap-1"
          key={queryFilterDetail?.title}
        >
          <span>
            {queryFilterDetail?.title}
            <span>{setToTitle ?? ' set to '}</span>
            <span className="font-bold">
              {queryFilterDetail?.valuesTitles?.join(', ')}
            </span>
          </span>
          {datasetName && isShowDatasetDetails && (
            <span className="attachment-dataset-name !mb-0 inline-flex items-center caption">
              <span className="attachment-dataset-icon mr-1">{datasetIcon}</span>
              {datasetName}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default AttachmentDetailsItem;
