'use client';

import { FC } from 'react';
import { StructureComponentValue } from '../../../../models/structure-component';
import { IconDatabase, IconExternalLink } from '@tabler/icons-react';

interface Props {
  dataset: StructureComponentValue;
  agency?: StructureComponentValue;
  lastUpdated?: StructureComponentValue;
  externalLink?: string;
  formatValue: (value: StructureComponentValue['value']) => string;
}

const DatasetInfoDetails: FC<Props> = ({
  dataset,
  agency,
  lastUpdated,
  externalLink,
  formatValue,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <IconDatabase className="size-4 text-neutrals-700" />
        <p className="h4 text-neutrals-1000 break-words">
          {formatValue(dataset?.value)}
        </p>
        {externalLink && (
          <a href={externalLink} target="_blank" rel="noopener noreferrer">
            <IconExternalLink className="text-primary cursor-pointer w-4 h-4 shrink-0" />
          </a>
        )}
      </div>
      {agency && (
        <div className="flex gap-1 body-3">
          <span className="text-neutrals-800">{agency?.title}:</span>
          <span className="text-neutrals-1000 break-words">
            {formatValue(agency?.value)}
          </span>
        </div>
      )}
      {lastUpdated && (
        <div className="flex gap-1 body-3">
          <span className="text-neutrals-800">{lastUpdated?.title}:</span>
          <span className="text-neutrals-1000 break-words">
            {formatValue(lastUpdated?.value)}
          </span>
        </div>
      )}
    </div>
  );
};

export default DatasetInfoDetails;
