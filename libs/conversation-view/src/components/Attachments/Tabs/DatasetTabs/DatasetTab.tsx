'use client';

import { FC } from 'react';
import classNames from 'classnames';
import { generateShortUrn } from '@statgpt/sdmx-toolkit/src/utils/urn';

interface Props {
  id: string;
  title?: string;
  version?: string;
  agency?: string;
  isActive?: boolean;
  isSingleTab?: boolean;
  onSelectDataset: (datasetUrn?: string) => void;
}

const DatasetTab: FC<Props> = ({
  id,
  title,
  version,
  agency,
  isActive,
  isSingleTab,
  onSelectDataset,
}) => {
  return (
    <div
      className={classNames(
        'dataset-tab truncate last:mr-4',
        isActive ? 'dataset-tab-active' : 'border-b-transparent',
        isSingleTab ? 'dataset-tab-single cursor-default' : 'cursor-pointer',
      )}
      title={title}
      onClick={() => {
        if (!isSingleTab) {
          onSelectDataset(generateShortUrn(id, version, agency));
        }
      }}
    >
      <h3
        className={classNames(
          'dataset-tab-title truncate',
          !isSingleTab && 'max-w-[250px]',
        )}
        title={title}
      >
        {title}
      </h3>
    </div>
  );
};

export default DatasetTab;
