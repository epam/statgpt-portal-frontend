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
      <div className="flex items-center gap-2">
        <IconDatabase className="size-4 text-neutrals-700" />
        <p className="h4 break-words text-neutrals-1000">
          {formatValue(dataset?.value)}
        </p>
        {externalLink && (
          <a href={externalLink} target="_blank" rel="noopener noreferrer">
            <IconExternalLink className="size-4 shrink-0 cursor-pointer text-primary" />
          </a>
        )}
      </div>
      {agency && (
        <div className="body-3 flex gap-1">
          <span className="text-neutrals-800">{agency?.title}:</span>
          <span className="break-words text-neutrals-1000">
            {formatValue(agency?.value)}
          </span>
        </div>
      )}
      {lastUpdated && (
        <div className="body-3 flex gap-1">
          <span className="text-neutrals-800">{lastUpdated?.title}:</span>
          <span className="break-words text-neutrals-1000">
            {formatValue(lastUpdated?.value)}
          </span>
        </div>
      )}
    </div>
  );
};

export default DatasetInfoDetails;
