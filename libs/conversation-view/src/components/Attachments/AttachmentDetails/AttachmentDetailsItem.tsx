import { FC } from 'react';
import { QueryFilterDetails } from '@statgpt/shared-toolkit/src/models/data-query';

interface Props {
  setToTitle?: string;
  queryFilterDetails?: QueryFilterDetails;
}

const AttachmentDetailsItem: FC<Props> = ({
  setToTitle,
  queryFilterDetails,
}) => {
  return (
    <>
      <p className="body-1 mb-2">
        {queryFilterDetails?.title}
        <span>{setToTitle ?? ' set to '}</span>
        <span className="font-bold">
          {queryFilterDetails?.valuesTitles?.join(', ')}
        </span>
      </p>
    </>
  );
};

export default AttachmentDetailsItem;
