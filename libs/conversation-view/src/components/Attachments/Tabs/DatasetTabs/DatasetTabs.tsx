'use client';

import { Dataflow } from '@epam/statgpt-sdmx-toolkit';
import { FC } from 'react';
import DatasetTabsDefaultMode from './DatasetTabsDefaultMode';

export interface DatasetTabsProps {
  datasets?: Dataflow[];
  locale?: string;
  initialSelectedDatasetUrn?: string;
  selectDataset?: (datasetUrn?: string) => void;
}

const DatasetTabs: FC<DatasetTabsProps> = ({
  datasets,
  locale,
  initialSelectedDatasetUrn,
  selectDataset,
}) => {
  return (
    <DatasetTabsDefaultMode
      datasets={datasets}
      locale={locale}
      initialSelectedDatasetUrn={initialSelectedDatasetUrn}
      selectDataset={selectDataset}
    />
  );
};

export default DatasetTabs;
