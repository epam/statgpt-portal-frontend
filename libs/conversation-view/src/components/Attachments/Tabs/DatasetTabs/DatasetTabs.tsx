'use client';

import { Dataflow } from '@epam/statgpt-sdmx-toolkit';
import { FC } from 'react';
import DatasetTabsDefaultMode from './DatasetTabsDefaultMode';
import DatasetTabsCrossMode from './DatasetTabsCrossMode';
import { useConversationViewFeatureToggles } from '../../../../context/ConversationViewFeatureTogglesContext';

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
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  if (isCrossDatasetModeOn) {
    return <DatasetTabsCrossMode datasets={datasets} locale={locale} />;
  }

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
