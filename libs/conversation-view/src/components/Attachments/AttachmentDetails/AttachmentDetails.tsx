import { FC } from 'react';
import { QueryFilterDetails } from '@statgpt/shared-toolkit/src/models/data-query';
import AttachmentDetailsItem from './AttachmentDetailsItem';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';

interface Props {
  titles: {
    queryUpdatedManuallyTitle?: string;
    setToTitle?: string;
  };
  queryFiltersDetails?: QueryFilterDetails[];
  isLoading?: boolean;
}

const AttachmentDetails: FC<Props> = ({
  titles,
  queryFiltersDetails,
  isLoading,
}) => {
  return (
    <div className="attachment-details flex flex-col">
      <p className="body-1 mb-2">
        {titles?.queryUpdatedManuallyTitle ??
          'Query has been updated manually.'}
      </p>
      {!isLoading ? (
        queryFiltersDetails?.map((queryFilterDetails) => (
          <AttachmentDetailsItem
            key={queryFilterDetails?.title}
            setToTitle={titles?.setToTitle}
            queryFilterDetails={queryFilterDetails}
          />
        ))
      ) : (
        <Loader />
      )}
    </div>
  );
};

export default AttachmentDetails;
